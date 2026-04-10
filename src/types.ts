export interface ThemeInfo {
  id: string;
  label: string;
  uiTheme?: 'vs' | 'vs-dark' | 'hc-black' | 'hc-light';
}

export interface SelectedThemes {
  light?: string;
  dark?: string;
  single?: string;
}

export interface ExtensionConfig {
  autoTriggerOnWindowOpen: boolean;
  writeToProjectSettings: boolean;
  missingSettingsBehavior: 'create' | 'temporary' | 'skip' | 'ask';
  includedColorThemes: string[];
  includedDarkColorThemes: string[];
}

export interface MissingSettingsBehaviorChoice {
  action: 'create' | 'temporary' | 'skip';
}

export interface ThemeValidationResult {
  valid: boolean;
  invalidThemes: string[];
}
