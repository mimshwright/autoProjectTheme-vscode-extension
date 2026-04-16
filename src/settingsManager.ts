import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { SelectedThemes } from './types';

export class SettingsManager {
  // Previous workspace-level values, captured before applying new themes
  private static previousColorTheme: string | undefined;
  private static previousLightTheme: string | undefined;
  private static previousDarkTheme: string | undefined;

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
    return settings['workbench.colorTheme'] !== undefined
      || settings['workbench.preferredLightColorTheme'] !== undefined
      || settings['workbench.preferredDarkColorTheme'] !== undefined;
  }

  /**
   * Ensure .vscode/settings.json exists on disk so that VS Code's
   * ConfigurationTarget.Workspace API can write to it without creating
   * an unsaved editor buffer.
   */
  private static async ensureSettingsFileExists(
    workspaceFolder: vscode.WorkspaceFolder
  ): Promise<void> {
    const settingsPath = await SettingsManager.getProjectSettingsPath(workspaceFolder);
    const vscodeDir = path.dirname(settingsPath);

    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    if (!fs.existsSync(settingsPath)) {
      fs.writeFileSync(settingsPath, '{}', 'utf-8');
    }
  }

  /**
   * Apply themes to workspace settings (scoped to this window only).
   * Creates .vscode/settings.json first if needed to avoid unsaved buffer issues.
   */
  static async applyThemesToWorkspace(
    workspaceFolder: vscode.WorkspaceFolder,
    themes: SelectedThemes
  ): Promise<void> {
    await SettingsManager.ensureSettingsFileExists(workspaceFolder);

    // Snapshot current workspace-level values before overwriting
    const settings = await SettingsManager.getProjectSettings(workspaceFolder);
    SettingsManager.previousColorTheme = settings['workbench.colorTheme'];
    SettingsManager.previousLightTheme = settings['workbench.preferredLightColorTheme'];
    SettingsManager.previousDarkTheme = settings['workbench.preferredDarkColorTheme'];

    const workbench = vscode.workspace.getConfiguration('workbench');
    await workbench.update('colorTheme', themes.light, vscode.ConfigurationTarget.Workspace);
    await workbench.update('preferredLightColorTheme', themes.light, vscode.ConfigurationTarget.Workspace);
    await workbench.update('preferredDarkColorTheme', themes.dark, vscode.ConfigurationTarget.Workspace);
  }

  /**
   * Restore previous workspace theme values. If a value was undefined
   * before we changed it, it gets removed from workspace settings.
   */
  static async revertThemes(): Promise<void> {
    const workbench = vscode.workspace.getConfiguration('workbench');
    await workbench.update('colorTheme', SettingsManager.previousColorTheme, vscode.ConfigurationTarget.Workspace);
    await workbench.update('preferredLightColorTheme', SettingsManager.previousLightTheme, vscode.ConfigurationTarget.Workspace);
    await workbench.update('preferredDarkColorTheme', SettingsManager.previousDarkTheme, vscode.ConfigurationTarget.Workspace);
  }
}
