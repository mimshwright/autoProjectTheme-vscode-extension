import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SettingsManager {
  static async getProjectSettingsPath(workspaceFolder: vscode.WorkspaceFolder): Promise<string> {
    return path.join(workspaceFolder.uri.fsPath, '.vscode', 'settings.json');
  }

  static async getProjectSettings(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<Record<string, any>> {
    const settingsPath = await SettingsManager.getProjectSettingsPath(workspaceFolder);

    if (!fs.existsSync(settingsPath)) {
      return {};
    }

    try {
      const content = fs.readFileSync(settingsPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse settings.json:', error);
      return {};
    }
  }

  static async hasThemeSet(workspaceFolder: vscode.WorkspaceFolder): Promise<boolean> {
    const settings = await SettingsManager.getProjectSettings(workspaceFolder);
    return settings['workbench.colorTheme'] !== undefined;
  }

  static async writeThemeToProject(
    workspaceFolder: vscode.WorkspaceFolder,
    themeName: string,
    isDark?: boolean
  ): Promise<void> {
    const settingsPath = await SettingsManager.getProjectSettingsPath(workspaceFolder);
    const vscodeDir = path.dirname(settingsPath);

    // Ensure .vscode directory exists
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    const settings = await SettingsManager.getProjectSettings(workspaceFolder);
    const key = isDark !== undefined
      ? (isDark ? 'workbench.colorTheme' : 'workbench.colorTheme')
      : 'workbench.colorTheme';

    settings[key] = themeName;

    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write theme to settings: ${error}`);
    }
  }

  static async applyThemeTemporarily(themeName: string): Promise<void> {
    try {
      await vscode.commands.executeCommand('workbench.action.selectTheme');
      await vscode.workspace
        .getConfiguration('workbench')
        .update('colorTheme', themeName, vscode.ConfigurationTarget.Global);
    } catch (error) {
      throw new Error(`Failed to apply theme: ${error}`);
    }
  }

  static async applyThemeToWorkspace(
    workspaceFolder: vscode.WorkspaceFolder,
    themeName: string
  ): Promise<void> {
    // Apply globally first so user sees it immediately
    await vscode.workspace
      .getConfiguration('workbench')
      .update('colorTheme', themeName, vscode.ConfigurationTarget.Global);

    // Then save to project settings
    await SettingsManager.writeThemeToProject(workspaceFolder, themeName);
  }
}
