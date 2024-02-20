import { ChatParticipant, Disposable, LanguageModelSystemMessage, LanguageModelUserMessage, ProgressLocation, chat, commands, lm, window } from "vscode";
import { WebsiteIndex } from "./websiteIndex";

const GPT_35 = 'copilot-gpt-3.5-turbo';

const participants = new Map<string, ChatParticipant>();

export function registerChatParticipant(name: string, url: string, index: WebsiteIndex): Disposable {
    const participant = chat.createChatParticipant(name, async (request, context, stream, token) => {
        if (request.command === 'refresh') {
            stream.markdown(`Ok! I'll refresh the index for @${name}`);
            await index.refresh();
            return {};
        }

        stream.progress('Searching for relevant context...');
        const chunks = (await index.search(request.prompt, 5, token));
        if (chunks.length === 0) {
            stream.markdown('Sorry, I could not find any relevant context.');
            return {};
        }

        let access;
        try {
            access = await lm.requestLanguageModelAccess(GPT_35);
        } catch(e) {
            access = await lm.requestLanguageModelAccess(lm.languageModels[0]);
        }
        let userMessages = new Array<LanguageModelUserMessage>();
        for (const chunk of chunks) {
            stream.reference(chunk.file);
            userMessages.push(new LanguageModelUserMessage(`HERE IS POTENTIALLY USEFUL CONTEXT FROM ${url}:\n${chunk.text}`));
        }
        const messages = [
            new LanguageModelSystemMessage(`
You are a helpful assistant specialized in ${url}.
The user will provide context from the website that starts with "HERE IS POTENTIALLY USEFUL CONTEXT FROM ${url}:".
The user will then ask a question.
You must only answer questions using that context and whatever else you know about ${url}.
Do not answer questions that are not related to the context.
`),
            ...userMessages,
            new LanguageModelUserMessage(request.prompt)
        ];
        const chatRequest = access.makeChatRequest(messages, {}, token);
        for await (const fragment of chatRequest.stream) {
            stream.markdown(fragment);
        }
        return {};
    });

    participant.description = `I do things with ${url}`;
    participant.fullName = `${new URL(url).hostname} Helper`;
    participant.commandProvider = {
        provideCommands(token) {
            return [{
                name: 'refresh',
                description: 'Refreshes the downloaded index. The downloaded index is refreshed on a regular interval, but if you feel like you are getting stale data, you can force the refreshing of the index.'
            }];
        },
    };

    participants.set(name, participant);
    
    return participant;
}

export function deleteAllParticipants() {
    for (const [_, participant] of participants) {
        participant.dispose();
    }
}

export function deleteParticipant(name: string) {
    participants.get(name)?.dispose();
}
