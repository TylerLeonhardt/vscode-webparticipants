import { ExtensionContext, commands, window } from 'vscode';
import { crawl } from './webCrawler';
import { WebsiteIndex } from './websiteIndex';
import { registerChatParticipant } from './chatParticipant';

const GPT_35 = 'copilot-gpt-3.5';
const GPT_4 = 'copilot-gpt-4';

export function activate(context: ExtensionContext) {
	const websites = context.globalState.get<{ name: string, url: string }[]>('websites') ?? [];
	commands.registerCommand('webParticipant.add', async () => {
		const url = await window.showInputBox({
			placeHolder: 'Website',
			validateInput(value: string) {
				if (!URL.canParse(value)) {
					return 'Not a valid URL';
				}
				return undefined;
			}
		});
		if (!url) {
			return;
		}
		const name = await window.showInputBox({
			placeHolder: 'Name',
			validateInput(value: string) {
				if (!value) {
					return 'Need a value';
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

	for (const { name, url } of websites) {
		context.subscriptions.push(registerChatParticipant(name, url, new WebsiteIndex(url, context.globalState)));
	}
}

export function deactivate() { }
