import { ExtensionContext, commands, window } from "vscode";
import { WebsiteIndex } from "../websiteIndex";
import { registerChatParticipant } from "../chatParticipant";

export function registerAddWebsiteCommand(context: ExtensionContext) {
    return commands.registerCommand('webParticipants.add', async () => {
        const websites = context.globalState.get<{ name: string, url: string }[]>('websites') ?? [];
        const url = await window.showInputBox({
            placeHolder: 'Website URL... (ex: https://tree-sitter.github.io/tree-sitter)',
            validateInput(value: string) {
                if (!URL.canParse(value)) {
                    return 'Not a valid URL';
                }
                if (websites.some(w => w.url === value)) {
                    return 'URL already registered';
                }
                return undefined;
            }
        });
        if (!url) {
            return;
        }
        const name = await window.showInputBox({
            placeHolder: 'Website name... (You will @name this website in chat)',
            validateInput(value: string) {
                if (!value) {
                    return 'Need a value';
                }
                if (websites.some(w => w.name === value)) {
                    return 'Name already taken';
                }
            }
        });
        if (!name) {
            return;
        }

        websites.push({ name, url });
        await context.globalState.update('websites', websites);
        const index = new WebsiteIndex(url, context.globalState);
        context.subscriptions.push(registerChatParticipant(name, url, index));
    });
}
