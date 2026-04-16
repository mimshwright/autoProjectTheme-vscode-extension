import * as vscode from 'vscode';
import { ThemeInfo, SelectedThemes } from './types';
import { ConfigResolver } from './configResolver';

export class ThemeManager {
  private static cachedThemes: ThemeInfo[] | null = null;

  static async getAllInstalledThemes(): Promise<ThemeInfo[]> {
    if (ThemeManager.cachedThemes !== null) {
      return ThemeManager.cachedThemes;
    }

    const allExtensions = vscode.extensions.all;
    const themeContributions = new Map<string, ThemeInfo>();

    for (const ext of allExtensions) {
      const packageJSON = ext.packageJSON;
      if (packageJSON.contributes?.themes) {
        for (const theme of packageJSON.contributes.themes) {
          // Theme id may be missing; use label as the identifier
          const id = theme.id || theme.label;
          if (id) {
            themeContributions.set(id, {
              id,
              label: theme.label || id,
              uiTheme: theme.uiTheme,
            });
          }
        }
      }
    }

    ThemeManager.cachedThemes = Array.from(themeContributions.values());
    console.log(`Auto Project Theme: found ${ThemeManager.cachedThemes.length} installed themes`);
    return ThemeManager.cachedThemes;
  }

  /**
   * Returns null if there are no themes to pick from (empty list and
   * useAllInstalledThemes is false).
   */
  static async selectRandomTheme(): Promise<SelectedThemes | null> {
    const config = ConfigResolver.getConfig();
    const allThemes = await ThemeManager.getAllInstalledThemes();

    // If useAllInstalledThemes is off and pool is empty, prompt the user
    if (!config.useAllInstalledThemes && config.randomThemePool.length === 0) {
      return null;
    }

    // When useAllInstalledThemes is on, ignore the pool and pick from everything
    const preferred = config.useAllInstalledThemes ? [] : config.randomThemePool;
    const lightThemes = allThemes.filter((t) => !t.uiTheme || t.uiTheme === 'vs');
    const lightTheme = ThemeManager.pickRandomTheme(preferred, lightThemes);

    // Try name matching first, then fall back to random dark
    const pairedDark = ThemeManager.findMatchingDarkTheme(lightTheme, allThemes);
    const darkThemes = allThemes.filter((t) => t.uiTheme === 'vs-dark');
    const darkTheme = pairedDark || ThemeManager.pickRandomTheme(preferred, darkThemes);

    console.log(`Auto Project Theme: paired light="${lightTheme}" dark="${darkTheme}"${pairedDark ? ' (matched by name)' : ''}`);

    return { light: lightTheme, dark: darkTheme };
  }

  private static pickRandomTheme(
    preferredList: string[],
    availableThemes: ThemeInfo[]
  ): string {
    if (preferredList.length > 0) {
      const filtered = availableThemes.filter((t) =>
        preferredList.includes(t.id) || preferredList.includes(t.label)
      );
      if (filtered.length > 0) {
        return filtered[Math.floor(Math.random() * filtered.length)].id;
      }
    }

    // Use all available themes (only reached when useAllInstalledThemes is on)
    if (availableThemes.length > 0) {
      return availableThemes[Math.floor(Math.random() * availableThemes.length)].id;
    }

    return 'Default Dark Modern';
  }

  /**
   * Normalize a theme name for pairing by stripping "light"/"dark" and
   * collapsing whitespace. e.g. "Solarized Light" and "Solarized Dark"
   * both normalize to "solarized".
   */
  private static normalizeForPairing(name: string): string {
    return name
      .toLowerCase()
      .replace(/\b(light|dark)\b/gi, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private static findMatchingDarkTheme(
    lightThemeName: string,
    allThemes: ThemeInfo[]
  ): string | null {
    const normalizedLight = ThemeManager.normalizeForPairing(lightThemeName);
    if (!normalizedLight) {
      return null;
    }

    const candidates = allThemes.filter(
      (t) =>
        t.uiTheme === 'vs-dark' &&
        ThemeManager.normalizeForPairing(t.label) === normalizedLight
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
