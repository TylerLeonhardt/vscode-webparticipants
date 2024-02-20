import { Disposable, ExtensionContext } from "vscode";
import { registerAddWebsiteCommand } from "./addWebsite";
import { registerListWebsitesCommand } from "./listWebsites";
import { registerDeleteWebsitesCommand } from "./deleteWebsites";

export function registerCommands(context: ExtensionContext): Disposable {
    return Disposable.from(
        registerAddWebsiteCommand(context),
        registerListWebsitesCommand(context),
        registerDeleteWebsitesCommand(context)
    );
}