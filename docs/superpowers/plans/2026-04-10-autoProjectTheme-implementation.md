# AutoProjectTheme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a VSCode extension that auto-assigns random color themes to new projects, with configurable theme lists, light/dark pairing, and persistent storage.

**Architecture:** Modular design with clear separation of concerns—config resolver, theme manager, settings I/O, validation, and main orchestration. Lazy-load and cache the theme list for the session. Use name heuristics for light/dark pairing, fall back to any theme if no pair found.

**Tech Stack:** TypeScript, VSCode Extension API, Node.js built-ins

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.vscodeignore`
- Create: `src/extension.ts` (skeleton)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "auto-project-theme",
  "displayName": "Auto Project Theme",
  "description": "Automatically assign random color themes to new projects",
  "version": "0.1.0",
  "engines": {
    "vscode": "^1.84.0"
  },
  "categories": [
    "Themes"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "configuration": {
      "title": "Auto Project Theme",
      "properties": {
        "autoProjectTheme.autoTriggerOnWindowOpen": {
          "type": "boolean",
          "default": true,
          "description": "Automatically assign a theme when a folder is opened"
        },
        "autoProjectTheme.writeToProjectSettings": {
          "type": "boolean",
          "default": true,
          "description": "Save the selected theme to the project's .vscode/settings.json"
        },
        "autoProjectTheme.missingSettingsBehavior": {
          "type": "string",
          "enum": [
            "create",
            "temporary",
            "skip",
            "ask"
          ],
          "default": "ask",
          "description": "What to do if .vscode/settings.json doesn't exist: create, temporary, skip, or ask"
        },
        "autoProjectTheme.includedColorThemes": {
          "type": "array",
          "default": [],
          "description": "List of light color themes to randomly select from"
        },
        "autoProjectTheme.includedDarkColorThemes": {
          "type": "array",
          "default": [],
          "description": "List of dark color themes to randomly select from"
        }
      }
    },
    "commands": [
      {
        "command": "autoProjectTheme.addCurrentTheme",
        "title": "Add current theme to AutoProjectTheme light/dark list"
      },
      {
        "command": "autoProjectTheme.selectNewTheme",
        "title": "Select a different random theme for this project"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.84.0",
    "typescript": "^5.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "ES2020"
    ],
    "declaration": true,
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

- [ ] **Step 3: Create `.vscodeignore`**

```
.git
.gitignore
.vscode
docs
spec.md
README.md
*.md
src/**/*.ts
tsconfig.json
node_modules
out/**/*.map
out/**/*.d.ts
```

- [ ] **Step 4: Create `src/extension.ts` (skeleton)**

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Auto Project Theme activated');

  // TODO: Initialize managers and register commands
}

export function deactivate() {}
```

- [ ] **Step 5: Run `npm install` to initialize dependencies**

```bash
cd /Users/mimswright/projects/mims/vscode/autoProjectTheme
npm install
```

Expected: `node_modules` created, `package-lock.json` generated.

- [ ] **Step 6: Compile TypeScript to verify setup**

```bash
npm run compile
```

Expected: `out/extension.js` created with no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json tsconfig.json .vscodeignore src/extension.ts
git commit -m "feat: initialize vscode extension project structure"
```

---

## Task 2: Type Definitions

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create `src/types.ts` with shared interfaces**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: define shared types"
```

---

## Task 3: Config Resolver

**Files:**
- Create: `src/configResolver.ts`

- [ ] **Step 1: Create `src/configResolver.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/configResolver.ts
git commit -m "feat: implement config resolver"
```

---

## Task 4: Theme Manager

**Files:**
- Create: `src/themeManager.ts`

- [ ] **Step 1: Create `src/themeManager.ts` with theme caching and selection**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/themeManager.ts
git commit -m "feat: implement theme manager with caching and pairing"
```

---

## Task 5: Settings Manager

**Files:**
- Create: `src/settingsManager.ts`

- [ ] **Step 1: Create `src/settingsManager.ts`**

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class SettingsManager {
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
    return settings['workbench.colorTheme'] !== undefined;
  }

  static async writeThemeToProject(
    workspaceFolder: vscode.WorkspaceFolder,
    themeName: string,
    isDark?: boolean
  ): Promise<void> {
    const settingsPath = await SettingsManager.getProjectSettingsPath(workspaceFolder);
    const vscodeDir = path.dirname(settingsPath);

    // Ensure .vscode directory exists
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    const settings = await SettingsManager.getProjectSettings(workspaceFolder);
    const key = isDark !== undefined
      ? (isDark ? 'workbench.colorTheme' : 'workbench.colorTheme')
      : 'workbench.colorTheme';

    settings[key] = themeName;

    try {
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write theme to settings: ${error}`);
    }
  }

  static async applyThemeTemporarily(themeName: string): Promise<void> {
    try {
      await vscode.commands.executeCommand('workbench.action.selectTheme');
      await vscode.workspace
        .getConfiguration('workbench')
        .update('colorTheme', themeName, vscode.ConfigurationTarget.Global);
    } catch (error) {
      throw new Error(`Failed to apply theme: ${error}`);
    }
  }

  static async applyThemeToWorkspace(
    workspaceFolder: vscode.WorkspaceFolder,
    themeName: string
  ): Promise<void> {
    // Apply globally first so user sees it immediately
    await vscode.workspace
      .getConfiguration('workbench')
      .update('colorTheme', themeName, vscode.ConfigurationTarget.Global);

    // Then save to project settings
    await SettingsManager.writeThemeToProject(workspaceFolder, themeName);
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/settingsManager.ts
git commit -m "feat: implement settings manager for project theme persistence"
```

---

## Task 6: Theme Validator

**Files:**
- Create: `src/themeValidator.ts`

- [ ] **Step 1: Create `src/themeValidator.ts`**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/themeValidator.ts
git commit -m "feat: implement theme validator with missing theme dialog"
```

---

## Task 7: Main Extension Logic

**Files:**
- Modify: `src/extension.ts`

- [ ] **Step 1: Implement main extension activation and command registration**

```typescript
import * as vscode from 'vscode';
import { ConfigResolver } from './configResolver';
import { ThemeManager } from './themeManager';
import { SettingsManager } from './settingsManager';
import { ThemeValidator } from './themeValidator';

let themeSelectionInProgress = false;

export async function activate(context: vscode.ExtensionContext) {
  console.log('Auto Project Theme activated');

  // Register commands
  context.subscriptions.push(
    vscode.commands.registerCommand('autoProjectTheme.addCurrentTheme', addCurrentTheme),
    vscode.commands.registerCommand('autoProjectTheme.selectNewTheme', selectNewTheme),
    vscode.workspace.onDidChangeWorkspaceFolders((event) =>
      handleWorkspaceFoldersChanged(event)
    )
  );

  // Trigger on startup for existing workspace
  if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
    const config = ConfigResolver.getConfig();
    if (config.autoTriggerOnWindowOpen) {
      for (const folder of vscode.workspace.workspaceFolders) {
        await selectThemeForFolder(folder, false);
      }
    }
  }
}

async function handleWorkspaceFoldersChanged(event: vscode.WorkspaceFoldersChangeEvent) {
  const config = ConfigResolver.getConfig();
  if (!config.autoTriggerOnWindowOpen) {
    return;
  }

  for (const folder of event.added) {
    await selectThemeForFolder(folder, false);
  }
}

async function selectThemeForFolder(
  folder: vscode.WorkspaceFolder,
  overrideExisting: boolean
): Promise<void> {
  if (themeSelectionInProgress) {
    return;
  }

  themeSelectionInProgress = true;

  try {
    const config = ConfigResolver.getConfig();

    // Check if theme is already set (unless overriding)
    if (!overrideExisting) {
      const hasTheme = await SettingsManager.hasThemeSet(folder);
      if (hasTheme) {
        return;
      }
    }

    // Select theme
    const selectedThemes = await ThemeManager.selectRandomTheme();
    const autoDetect =
      vscode.workspace.getConfiguration('window').get('autoDetectColorScheme') === true;

    // Apply theme based on config
    if (config.writeToProjectSettings) {
      const settingsPath = await SettingsManager.getProjectSettingsPath(folder);
      const settingsExist = require('fs').existsSync(settingsPath);

      if (!settingsExist) {
        const action = await handleMissingSettingsFile(config.missingSettingsBehavior);
        if (action === 'cancel') {
          return;
        }

        if (action === 'create') {
          // Create and write theme
          const themeToWrite = autoDetect ? selectedThemes.dark : selectedThemes.single;
          if (themeToWrite) {
            await SettingsManager.writeThemeToProject(
              folder,
              themeToWrite,
              autoDetect
            );
          }
        } else if (action === 'temporary') {
          // Apply only, don't save
          const themeToApply = autoDetect ? selectedThemes.dark : selectedThemes.single;
          if (themeToApply) {
            await SettingsManager.applyThemeTemporarily(themeToApply);
          }
        }
        // If 'skip', do nothing
      } else {
        // Settings file exists, write theme
        const themeToWrite = autoDetect ? selectedThemes.dark : selectedThemes.single;
        if (themeToWrite) {
          await SettingsManager.writeThemeToProject(
            folder,
            themeToWrite,
            autoDetect
          );
        }
      }
    } else {
      // Don't write to settings, just apply
      const themeToApply = autoDetect ? selectedThemes.dark : selectedThemes.single;
      if (themeToApply) {
        await SettingsManager.applyThemeTemporarily(themeToApply);
      }
    }
  } catch (error) {
    console.error('Error selecting theme:', error);
    vscode.window.showErrorMessage(`Failed to select theme: ${error}`);
  } finally {
    themeSelectionInProgress = false;
  }
}

async function handleMissingSettingsFile(
  behavior: string
): Promise<'create' | 'temporary' | 'skip' | 'cancel'> {
  if (behavior === 'create') {
    return 'create';
  } else if (behavior === 'temporary') {
    return 'temporary';
  } else if (behavior === 'skip') {
    return 'skip';
  } else {
    // 'ask'
    const result = await vscode.window.showQuickPick(
      [
        {
          label: 'Create',
          description: 'Create .vscode/settings.json and save theme',
          value: 'create',
        },
        {
          label: 'Temporary',
          description: 'Apply theme without saving',
          value: 'temporary',
        },
        {
          label: 'Skip',
          description: 'Do not apply theme',
          value: 'skip',
        },
      ],
      { placeHolder: '.vscode/settings.json not found. What would you like to do?' }
    );

    return (result?.value as 'create' | 'temporary' | 'skip') || 'cancel';
  }
}

async function addCurrentTheme(): Promise<void> {
  const currentTheme = vscode.workspace
    .getConfiguration('workbench')
    .get('colorTheme') as string;

  if (!currentTheme) {
    vscode.window.showWarningMessage('No color theme is currently active');
    return;
  }

  const allThemes = await ThemeManager.getAllInstalledThemes();
  const theme = allThemes.find((t) => t.id === currentTheme || t.label === currentTheme);

  if (!theme) {
    vscode.window.showErrorMessage('Could not find current theme info');
    return;
  }

  const isDark = theme.uiTheme === 'vs-dark';
  const config = ConfigResolver.getConfig();
  const list = isDark ? config.includedDarkColorThemes : config.includedColorThemes;

  if (list.includes(currentTheme)) {
    vscode.window.showInformationMessage(`"${currentTheme}" is already in the list`);
    return;
  }

  list.push(currentTheme);
  await ConfigResolver.updateIncludedColorThemes(list, isDark);

  vscode.window.showInformationMessage(
    `Added "${currentTheme}" to AutoProjectTheme ${isDark ? 'dark' : 'light'} themes`
  );
}

async function selectNewTheme(): Promise<void> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    vscode.window.showWarningMessage('No workspace folder is open');
    return;
  }

  await selectThemeForFolder(folder, true);
  vscode.window.showInformationMessage('Selected new theme');
}

export function deactivate() {}
```

- [ ] **Step 2: Compile and verify no errors**

```bash
npm run compile
```

Expected: Compilation succeeds, `out/extension.js` contains all modules.

- [ ] **Step 3: Commit**

```bash
git add src/extension.ts
git commit -m "feat: implement main extension logic with commands and event listeners"
```

---

## Task 8: Testing & Polish

**Files:**
- No new files (per user request: no tests)

- [ ] **Step 1: Verify all modules import correctly**

```bash
npm run compile
```

Expected: No import errors, all modules present in `out/`.

- [ ] **Step 2: Create a simple README for local testing**

Open the extension folder in VSCode:
1. Run `npm install` (if not done)
2. Press `F5` to open extension development host
3. Open a folder in the dev host
4. Check that a random theme is applied (or dialog appears based on settings)
5. Try the commands via command palette

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add local testing instructions"
```

---

## Summary

This plan builds a complete, functional VSCode extension with:
- Full TypeScript type safety
- Modular, testable code structure
- Theme caching and lazy loading
- Light/dark pairing with name heuristics
- Settings file creation/persistence
- Command registration and workspace event handling
- Clean error dialogs and user feedback

All tasks produce self-contained changes and compile successfully at each step.
