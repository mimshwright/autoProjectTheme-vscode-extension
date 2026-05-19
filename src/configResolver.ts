import * as vscode from "vscode";
import { ExtensionConfig } from "./types";

export class ConfigResolver {
  static getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration("autoProjectTheme");

    return {
      autoTriggerOnWindowOpen: config.get("autoTriggerOnWindowOpen", true),
      randomThemePool: config.get("randomThemePool", []),
      useAllInstalledThemes: config.get("useAllInstalledThemes", false),
    };
  }

  static async updateRandomThemePool(themes: string[]): Promise<void> {
    const config = vscode.workspace.getConfiguration("autoProjectTheme");
    await config.update(
      "randomThemePool",
      themes,
      vscode.ConfigurationTarget.Global,
    );
  }
}
