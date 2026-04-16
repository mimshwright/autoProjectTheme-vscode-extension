export interface ThemeInfo {
  id: string;
  label: string;
  uiTheme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
}

export interface SelectedThemes {
  light: string;
  dark: string;
}

export interface ExtensionConfig {
  autoTriggerOnWindowOpen: boolean;
  randomThemePool: string[];
  useAllInstalledThemes: boolean;
}

export interface ThemeValidationResult {
  valid: boolean;
  invalidThemes: string[];
}
