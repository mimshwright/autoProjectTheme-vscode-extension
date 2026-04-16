# Spec: AutoProjectTheme

Create an extension for VSCode for applying new themes to new project windows.

## Features

**Trigger:** When a new window is opened or a new folder is added (if `autoTriggerOnWindowOpen` is true), or manually via command.

**Core behavior:** Check if the project has a color theme set in .vscode/settings.json

- If it does, do nothing.
- If not, pick a random theme and optionally write it to the project's .vscode/settings.json
- Select from the configured list if provided; otherwise choose from all installed themes.
- If `window.autoDetectColorScheme` is true, pick both a light and dark theme so the project is ready when the system preference changes.

**Theme validation:** If a theme in the configured list is not available:

- Try to show a dialog asking if the user wants to remove it from the list or pick a new random theme.
- If that's not feasible, silently skip it and pick another.

**Empty lists:** If no light/dark themes are configured, choose from all installed themes. Auto-detect light vs. dark if possible.

## Config settings

| setting                   | type             | default | description                                                                                                                                                                                                                                                                                                                 |
| ------------------------- | ---------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `writeToProjectSettings`  | boolean          | true    | Determines whether to save theme to local settings.                                                                                                                                                                                                                                                                         |
| `missingSettingsBehavior` | select           | `ask`   | if a folder is opened and there is no .vscode/settings.json, determine what to do. Options are: `create`, `temporary`, `none`, `ask`. `create` creates a new settings file, `temporary` sets the theme but doesn't save it, `none` doesn't change the theme, `ask` asks if you want to create one (offers other 3 choices). |
| includedColorThemes       | array of strings | []      | Comma-separated list of (light) color themes to be included in the random color theme selection. If window.autoDetectColorScheme is true, this is only the light color themes.                                                                                                                                              |
| includedDarkColorThemes   | array of strings | []      | Comma-separated list of dark color themes to be included in the random color theme selection. Ignored if window.autoDetectColorScheme is false                                                                                                                                                                              |

## Commands

- **Add current theme to AutoProjectTheme light/dark list** - appends this theme name to the list of included themes.
- **Select a different random theme for this project** - Cycles to a new random theme from the list.
