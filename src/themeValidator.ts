import * as vscode from 'vscode';
import { ConfigResolver } from './configResolver';
import { ThemeManager } from './themeManager';

export class ThemeValidator {
  static async validateTheme(themeName: string): Promise<boolean> {
    const allThemes = await ThemeManager.getAllInstalledThemes();
    return allThemes.some((t) => t.id === themeName || t.label === themeName);
  }

  static async validateAndFixThemes(
    themeNames: string[],
    isDark: boolean
  ): Promise<{ valid: string[]; invalid: string[] }> {
    const allThemes = await ThemeManager.getAllInstalledThemes();
    const themeIds = new Set(allThemes.map((t) => t.id));
    const themeLabels = new Set(allThemes.map((t) => t.label));

    const valid: string[] = [];
    const invalid: string[] = [];

    for (const name of themeNames) {
      if (themeIds.has(name) || themeLabels.has(name)) {
        valid.push(name);
      } else {
        invalid.push(name);
      }
    }

    return { valid, invalid };
  }

  static async handleInvalidTheme(
    themeName: string,
    isDark: boolean
  ): Promise<'remove' | 'skip' | 'cancel'> {
    const result = await vscode.window.showQuickPick(
      [
        {
          label: 'Remove from list and pick again',
          description: `Remove "${themeName}" from the list and select a different theme`,
          value: 'remove',
        },
        {
          label: 'Pick again',
          description: 'Select a different theme, keep invalid theme in config',
          value: 'skip',
        },
        {
          label: 'Cancel',
          description: 'Do nothing',
          value: 'cancel',
        },
      ],
      { placeHolder: `Theme "${themeName}" is not installed. What would you like to do?` }
    );

    return (result?.value as 'remove' | 'skip' | 'cancel') || 'cancel';
  }

  static async removeThemeFromConfig(
    themeName: string,
    isDark: boolean
  ): Promise<void> {
    await ConfigResolver.removeThemeFromConfig(themeName, isDark);
  }
}
