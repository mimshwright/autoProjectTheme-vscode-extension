# Auto Project Theme

Automatically assigns a random color theme to each project so your VS Code windows are visually distinct.

_Notice, this extension was vibe coded. Use at your own risk._

## How it works

- When you open a folder that doesn't have a theme set in `.vscode/settings.json`, the extension picks a random light/dark theme pair and applies it
- A confirmation dialog lets you keep the theme, try a different one, or cancel
- Choosing "Keep" saves the theme to the project's `.vscode/settings.json`
- The extension automatically pairs light and dark variants of the same theme (e.g. "Solarized Light" and "Solarized Dark")

## Commands

- **AutoProjectTheme: Edit theme pool** - opens a multi-select picker to choose which installed themes to include in your random pool
- **AutoProjectTheme: Select a different random theme for this project** - picks a new random theme and shows the confirmation dialog
- **AutoProjectTheme: Toggle use all installed themes** - toggles between using the curated pool or all installed themes

## Settings

- `autoProjectTheme.autoTriggerOnWindowOpen` - automatically assign a theme when a folder is opened (default: `true`)
- `autoProjectTheme.randomThemePool` - list of theme names to randomly pick from; light and dark types are detected automatically
- `autoProjectTheme.useAllInstalledThemes` - use all installed themes instead of only those in the random theme pool (default: `false`)

## Getting started

1. Install the extension
2. Either:
   - Toggle "use all installed themes" with the command palette, or
   - Add themes to your pool one at a time: switch to a theme you like, then run "Add current theme to pool"
3. Open a project without a theme set and the extension will pick one for you
