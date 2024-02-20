import { ExtensionContext, commands, window } from 'vscode';
import { WebsiteIndex } from './websiteIndex';
import { registerChatParticipant } from './chatParticipant';
import { registerCommands } from './commands/commands';

export function activate(context: ExtensionContext) {
	const websites = context.globalState.get<{ name: string, url: string }[]>('websites') ?? [];
	registerCommands(context);

	for (const { name, url } of websites) {
		context.subscriptions.push(registerChatParticipant(name, url, new WebsiteIndex(url, context.globalState)));
	}
}

export function deactivate() { }
