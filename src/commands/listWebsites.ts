import { Disposable, ExtensionContext, QuickPickItemKind, ThemeIcon, commands, window } from "vscode";
import { deleteParticipant } from "../chatParticipant";

export function registerListWebsitesCommand(context: ExtensionContext) {
    return commands.registerCommand('webParticipants.list', async () => {
        const websites = context.globalState.get<{ name: string, url: string }[]>('websites') ?? [];
        const disposables = new Array<Disposable>();
        const qp = window.createQuickPick();
        disposables.push(qp);
        qp.matchOnDetail = true;
        qp.placeholder = 'All registered websites...';
        const addWebsite = { label: '$(add) Add website...' };
        qp.items = [
            addWebsite,
            { kind: QuickPickItemKind.Separator, label: '' },
            ...websites.map(w => ({
                label: w.name,
                detail: w.url,
                buttons: [{
                    iconPath: new ThemeIcon('trash'),
                    tooltip: `Delete @${w.name}`
                }]
            }))
        ];
        disposables.push(qp.onDidTriggerItemButton((e) => {
            const selectedWebsite = websites.find(w => w.name === e.item.label);
            if (selectedWebsite) {
                const index = websites.indexOf(selectedWebsite);
                websites.splice(index, 1);
                context.globalState.update('websites', websites);
                deleteParticipant(selectedWebsite.name);
            }
            qp.items = [
                addWebsite,
                { kind: QuickPickItemKind.Separator, label: '' },
                ...websites.map(w => ({
                    label: w.name,
                    detail: w.url,
                    buttons: [{
                        iconPath: new ThemeIcon('trash'),
                        tooltip: `Delete @${w.name}`
                    }]
                }))
            ];
        }));
        disposables.push(qp.onDidHide(() => {
            Disposable.from(...disposables).dispose();
        }));
        disposables.push(qp.onDidChangeSelection(e => {
            if (addWebsite === e[0]) {
                commands.executeCommand('webParticipants.add');
            }
        }));
        qp.show();
    });
}
