# Design: AutoProjectTheme VSCode Extension

**Date:** 2026-04-10  
**Status:** Approved

## Overview

A VSCode extension that automatically assigns random color themes to new project windows. When a project opens without a theme set, the extension picks a random one from a configured list (or all installed themes if none configured) and optionally saves it to the project's `.vscode/settings.json`. This gives different projects visually distinct appearances, making context-switching easier.

## Features

### Core Behavior

1. **Auto-trigger on folder open:** When a folder is opened, check if it has a color theme in `.vscode/settings.json`
   - If it does: do nothing
   - If not: pick a random theme and apply it (optionally save based on config)

2. **Manual trigger via command:** User can invoke commands to manually change the theme
   - Commands always override existing theme (unlike auto-trigger)

3. **Theme selection:**
   - If `includedColorThemes` / `includedDarkColorThemes` are configured, select from those lists
   - If both lists are empty, select from all installed themes
   - If `window.autoDetectColorScheme` is true, pick a light + dark pair (so the project is ready when system preference changes)
   - Use name heuristics to match light/dark pairs (e.g., "Monokai" → "Monokai Pro Dark"), fall back to any light/dark if no pair found

4. **Theme validation & error handling:**
   - If a selected theme doesn't exist, show dialog:
     - **"Remove from list and pick again"** — removes invalid theme from config, picks new one, applies it
     - **"Pick again"** — picks new random theme, keeps invalid theme in config
     - **"Cancel"** — does nothing
   - If settings write fails, notify user but keep theme applied

5. **Missing settings file behavior:**
   - `create`: Create `.vscode/settings.json` and write theme
   - `temporary`: Apply theme without creating/saving
   - `skip`: Do nothing, don't apply theme
   - `ask`: Show dialog with three options above; after user chooses, immediately apply theme (or not if they chose `skip`)

### Commands

1. **Add current theme to AutoProjectTheme light/dark list** — appends current theme to the appropriate list
2. **Select a different random theme for this project** — picks and applies a new random theme, overwriting existing setting

## Architecture

### Activation Model

- Extension activates on VSCode startup
- Listens to `vscode.workspace.onDidChangeWorkspaceFolders` event
- Also exposes commands for manual triggering
- `autoTriggerOnWindowOpen` setting controls whether folder-open events trigger auto-selection (default: true)

### Module Structure

1. **extension.ts** — Main entry point; registers commands, listens to workspace events, orchestrates the flow
2. **ThemeManager** — Selects random theme(s), handles light/dark pairing, name-based matching with fallback
3. **SettingsManager** — Reads/writes `.vscode/settings.json` and extension config, handles the three save behaviors
4. **ThemeValidator** — Checks if theme is installed, shows missing-theme dialog with user options
5. **ConfigResolver** — Parses extension settings, applies defaults, validates config

### Data Flow

**On folder open (if `autoTriggerOnWindowOpen` is true):**

1. Check if project already has a theme set → if yes, exit
2. Load theme cache (fetch and cache if empty)
3. Parse `includedColorThemes` and `includedDarkColorThemes`; if both empty, use all installed themes
4. Pick random theme(s):
   - If `autoDetectColorScheme` is true: pick light + dark pair (heuristic match, fallback to any)
   - If false: pick single theme
5. Validate each theme; if invalid, show dialog (user chooses to remove + retry, retry, or cancel)
6. Apply theme via VSCode settings API
7. If `writeToProjectSettings` is true, write to `.vscode/settings.json` (create if needed based on `missingSettingsBehavior`)

**On manual command:**

- Same flow as above, but skip the "already set" check (always apply new theme)

### Theme Caching

- Load theme list once per session (first use), store in extension state
- Cache clears on extension reload, ensuring new theme installs are picked up
- No periodic refresh; manual refresh can be added later if needed

## Configuration

All settings under `autoProjectTheme.*`:

| Setting                   | Type    | Default | Description                                                                               |
| ------------------------- | ------- | ------- | ----------------------------------------------------------------------------------------- |
| `autoTriggerOnWindowOpen` | boolean | true    | Auto-assign theme when folder opens                                                       |
| `writeToProjectSettings`  | boolean | true    | Save theme to project's `.vscode/settings.json`                                           |
| `missingSettingsBehavior` | select  | ask     | What to do if `.vscode/settings.json` doesn't exist: `create`, `temporary`, `skip`, `ask` |
| `includedColorThemes`     | array   | []      | Light theme names to randomly select from                                                 |
| `includedDarkColorThemes` | array   | []      | Dark theme names to randomly select from                                                  |

## Error Handling

- **Theme validation fails:** Show dialog (remove from list, pick again, or cancel)
- **Settings write fails:** Notify user, but keep theme applied
- **Config parse errors:** Log and use defaults
- **VSCode API failures:** Log and show notification (unlikely, but graceful fallback)

## Future Enhancements

- High contrast theme support (separate `includedHighContrastThemes` list)
- Theme install detection (refresh cache when user installs new themes)
- Per-project theme history (don't repeat the same theme twice in a row)
- Theme pair mapping UI (help users define custom light/dark pairs)
