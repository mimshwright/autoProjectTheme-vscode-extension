import * as vscode from 'vscode';
import { ExtensionConfig } from './types';

export class ConfigResolver {
  static getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration('autoProjectTheme');

    return {
      autoTriggerOnWindowOpen: config.get('autoTriggerOnWindowOpen', true),
      writeToProjectSettings: config.get('writeToProjectSettings', true),
      missingSettingsBehavior: config.get(
        'missingSettingsBehavior',
        'ask'
      ) as ExtensionConfig['missingSettingsBehavior'],
      includedColorThemes: config.get('includedColorThemes', []),
      includedDarkColorThemes: config.get('includedDarkColorThemes', []),
    };
  }

  static async updateIncludedColorThemes(
    themes: string[],
    isDark: boolean
  ): Promise<void> {
    const config = vscode.workspace.getConfiguration('autoProjectTheme');
    const key = isDark ? 'includedDarkColorThemes' : 'includedColorThemes';
    await config.update(key, themes, vscode.ConfigurationTarget.Global);
  }

  static async removeThemeFromConfig(
    themeName: string,
    isDark: boolean
  ): Promise<void> {
    const config = ConfigResolver.getConfig();
    const key = isDark ? 'includedDarkColorThemes' : 'includedColorThemes';
    const list = isDark ? config.includedDarkColorThemes : config.includedColorThemes;

    const filtered = list.filter((t) => t !== themeName);
    await ConfigResolver.updateIncludedColorThemes(filtered, isDark);
  }
}
