import * as vscode from "vscode";
import { SelectedThemes } from "./types";
import { ConfigResolver } from "./configResolver";
import { ThemeManager } from "./themeManager";
import { SettingsManager } from "./settingsManager";

let themeSelectionInProgress = false;

export async function activate(context: vscode.ExtensionContext) {
  console.log("Auto Project Theme activated");

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "autoProjectTheme.addCurrentTheme",
      addThemesToPool,
    ),
    vscode.commands.registerCommand(
      "autoProjectTheme.selectNewTheme",
      selectNewTheme,
    ),
    vscode.commands.registerCommand(
      "autoProjectTheme.toggleUseAllThemes",
      toggleUseAllThemes,
    ),
    vscode.workspace.onDidChangeWorkspaceFolders((event) =>
      handleWorkspaceFoldersChanged(event),
    ),
  );

  // Trigger on startup for existing workspace
  if (
    vscode.workspace.workspaceFolders &&
    vscode.workspace.workspaceFolders.length > 0
  ) {
    const config = ConfigResolver.getConfig();
    if (config.autoTriggerOnWindowOpen) {
      for (const folder of vscode.workspace.workspaceFolders) {
        await selectThemeForFolder(folder, false, true);
      }
    }
  }
}

async function handleWorkspaceFoldersChanged(
  event: vscode.WorkspaceFoldersChangeEvent,
) {
  const config = ConfigResolver.getConfig();
  if (!config.autoTriggerOnWindowOpen) {
    return;
  }

  for (const folder of event.added) {
    await selectThemeForFolder(folder, false, true);
  }
}

async function selectThemeForFolder(
  folder: vscode.WorkspaceFolder,
  overrideExisting: boolean,
  showConfirmation: boolean = false,
): Promise<void> {
  if (themeSelectionInProgress) {
    return;
  }

  themeSelectionInProgress = true;

  try {
    // Check if theme is already set (unless overriding)
    if (!overrideExisting) {
      const hasTheme = await SettingsManager.hasThemeSet(folder);
      if (hasTheme) {
        return;
      }
    }

    // Select theme pair and apply to workspace
    const themes = await ThemeManager.selectRandomTheme();
    if (!themes) {
      await showNoThemesDialog();
      return;
    }
    console.log(
      `Auto Project Theme: selected light="${themes.light}" dark="${themes.dark}" for ${folder.name}`,
    );
    await SettingsManager.applyThemesToWorkspace(folder, themes);

    if (showConfirmation) {
      const action = await showThemeConfirmationDialog(themes);

      if (action === "different") {
        await SettingsManager.revertThemes();
        themeSelectionInProgress = false;
        await selectThemeForFolder(folder, true, true);
        return;
      } else if (action === "cancel") {
        await SettingsManager.revertThemes();
        return;
      }
      // 'save' — already applied, nothing more to do
    }
  } catch (error) {
    console.error("Error selecting theme:", error);
    vscode.window.showErrorMessage(`Failed to select theme: ${error}`);
  } finally {
    themeSelectionInProgress = false;
  }
}

async function showThemeConfirmationDialog(
  themes: SelectedThemes,
): Promise<"save" | "different" | "cancel"> {
  const description =
    themes.light === themes.dark
      ? `"${themes.light}"`
      : `"${themes.light}" (light) / "${themes.dark}" (dark)`;

  const result = await vscode.window.showQuickPick(
    [
      {
        label: "Keep this theme",
        description: "Save to .vscode/settings.json",
        value: "save",
      },
      {
        label: "Try a different theme",
        description: "Pick another random theme instead",
        value: "different",
      },
      {
        label: "Cancel",
        description: "Revert to previous theme",
        value: "cancel",
      },
    ],
    { placeHolder: `AutoProjectTheme applied ${description}. Keep it?` },
  );

  return (result?.value as "save" | "different" | "cancel") || "cancel";
}

async function addThemesToPool(): Promise<void> {
  const allThemes = await ThemeManager.getAllInstalledThemes();
  const currentPool =
    vscode.workspace
      .getConfiguration("autoProjectTheme")
      .inspect<string[]>("randomThemePool")?.globalValue ?? [];

  const items = allThemes
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((t) => ({
      label: t.label,
      description:
        t.uiTheme === "vs"
          ? "light"
          : t.uiTheme === "vs-dark"
            ? "dark"
            : "high contrast",
      picked: currentPool.includes(t.id) || currentPool.includes(t.label),
    }));

  const selected = await vscode.window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: "Select themes to include in the random pool",
  });

  if (!selected) {
    return;
  }

  const selectedLabels = selected.map((s) => s.label);
  const newPool = allThemes
    .filter((t) => selectedLabels.includes(t.label))
    .map((t) => t.id);

  await ConfigResolver.updateRandomThemePool(newPool);
  vscode.window.showInformationMessage(
    `Random theme pool updated with ${newPool.length} theme${newPool.length === 1 ? "" : "s"}`,
  );
}

async function toggleUseAllThemes(): Promise<void> {
  const config = vscode.workspace.getConfiguration("autoProjectTheme");
  const current = config.get<boolean>("useAllInstalledThemes", false);
  await config.update(
    "useAllInstalledThemes",
    !current,
    vscode.ConfigurationTarget.Global,
  );
  vscode.window.showInformationMessage(
    `AutoProjectTheme: "Use all installed themes" ${!current ? "enabled" : "disabled"}`,
  );
}

async function selectNewTheme(): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    vscode.window.showWarningMessage("No workspace folder is open");
    return;
  }

  await selectThemeForFolder(folder, true, true);
}

async function showNoThemesDialog(): Promise<void> {
  const addTheme = "Add Current Theme";
  const openSettings = "Open Settings";

  const result = await vscode.window.showInformationMessage(
    'Auto Project Theme has an empty random theme pool. Add themes with the "Add current theme to pool" command, edit "autoProjectTheme.randomThemePool" in settings, or enable "autoProjectTheme.useAllInstalledThemes" to use all installed themes.',
    addTheme,
    openSettings,
  );

  if (result === addTheme) {
    await vscode.commands.executeCommand("autoProjectTheme.addCurrentTheme");
  } else if (result === openSettings) {
    await vscode.commands.executeCommand(
      "workbench.action.openSettings",
      "autoProjectTheme",
    );
  }
}

export function deactivate() {}
