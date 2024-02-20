import { ExtensionContext, commands, window } from "vscode";
import { deleteAllParticipants } from "../chatParticipant";

export function registerDeleteWebsitesCommand(context: ExtensionContext) {
    return commands.registerCommand('webParticipants.deleteAll', async () => {
        const result = await window.showInformationMessage(
            'Are you SURE you want to DELETE ALL websites?',
            { modal: true },
            'Yes');

        if (!result) {
            return;
        }
        
        context.globalState.update('websites', undefined);
        deleteAllParticipants();
    });
}
