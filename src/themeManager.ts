import * as vscode from 'vscode';
import { ThemeInfo, SelectedThemes } from './types';
import { ConfigResolver } from './configResolver';

export class ThemeManager {
  private static cachedThemes: ThemeInfo[] | null = null;

  static async getAllInstalledThemes(): Promise<ThemeInfo[]> {
    if (ThemeManager.cachedThemes !== null) {
      return ThemeManager.cachedThemes;
    }

    // Query VSCode for all color themes
    const themesList = await vscode.commands.executeCommand(
      'workbench.action.showSettings',
      'workbench.colorTheme'
    ) as any;

    // Fallback: manually extract from available themes via VSCode API
    // We'll poll the list by checking what VSCode knows about
    const themes: ThemeInfo[] = [];

    // Get a list of installed themes by checking the extension data
    const allExtensions = vscode.extensions.all;
    const themeContributions = new Map<string, ThemeInfo>();

    for (const ext of allExtensions) {
      const packageJSON = ext.packageJSON;
      if (packageJSON.contributes?.themes) {
        for (const theme of packageJSON.contributes.themes) {
          themeContributions.set(theme.id, {
            id: theme.id,
            label: theme.label,
            uiTheme: theme.uiTheme,
          });
        }
      }
    }

    ThemeManager.cachedThemes = Array.from(themeContributions.values());
    return ThemeManager.cachedThemes;
  }

  static async selectRandomTheme(): Promise<SelectedThemes> {
    const config = ConfigResolver.getConfig();
    const allThemes = await ThemeManager.getAllInstalledThemes();
    const autoDetectColorScheme =
      vscode.workspace.getConfiguration('window').get('autoDetectColorScheme') === true;

    if (autoDetectColorScheme) {
      return ThemeManager.selectLightDarkPair(config, allThemes);
    } else {
      const theme = ThemeManager.pickRandomTheme(
        config.includedColorThemes,
        allThemes
      );
      return { single: theme };
    }
  }

  private static selectLightDarkPair(
    config: any,
    allThemes: ThemeInfo[]
  ): SelectedThemes {
    const lightTheme = ThemeManager.pickRandomTheme(
      config.includedColorThemes,
      allThemes.filter((t) => !t.uiTheme || t.uiTheme === 'vs')
    );

    const darkTheme = ThemeManager.pickRandomTheme(
      config.includedDarkColorThemes,
      allThemes.filter((t) => t.uiTheme === 'vs-dark')
    );

    // Try to find matching pair by name heuristic
    const pairedDark = ThemeManager.findMatchingDarkTheme(lightTheme, allThemes);
    const pairedLight = ThemeManager.findMatchingLightTheme(darkTheme, allThemes);

    return {
      light: pairedDark ? lightTheme : lightTheme,
      dark: pairedDark || darkTheme,
    };
  }

  private static pickRandomTheme(
    preferredList: string[],
    availableThemes: ThemeInfo[]
  ): string {
    if (preferredList.length > 0) {
      // Filter available to match preferred list
      const filtered = availableThemes.filter((t) =>
        preferredList.includes(t.id) || preferredList.includes(t.label)
      );
      if (filtered.length > 0) {
        const random = Math.floor(Math.random() * filtered.length);
        return filtered[random].id;
      }
    }

    // Fallback: pick any available theme
    if (availableThemes.length > 0) {
      const random = Math.floor(Math.random() * availableThemes.length);
      return availableThemes[random].id;
    }

    // Last resort: return a known theme name
    return 'Default Dark Modern';
  }

  private static findMatchingDarkTheme(
    lightThemeName: string,
    allThemes: ThemeInfo[]
  ): string | null {
    // Try prefix matching: "Monokai" -> "Monokai Dark", "Monokai Pro Dark", etc.
    const prefix = lightThemeName.split(' ')[0];
    const candidates = allThemes.filter(
      (t) =>
        t.uiTheme === 'vs-dark' &&
        (t.label.includes(prefix) || t.id.includes(prefix.toLowerCase()))
    );

    if (candidates.length > 0) {
      return candidates[0].id;
    }

    return null;
  }

  private static findMatchingLightTheme(
    darkThemeName: string,
    allThemes: ThemeInfo[]
  ): string | null {
    const prefix = darkThemeName.split(' ')[0];
    const candidates = allThemes.filter(
      (t) =>
        (!t.uiTheme || t.uiTheme === 'vs') &&
        (t.label.includes(prefix) || t.id.includes(prefix.toLowerCase()))
    );

    if (candidates.length > 0) {
      return candidates[0].id;
    }

    return null;
  }

  static clearCache(): void {
    ThemeManager.cachedThemes = null;
  }
}
