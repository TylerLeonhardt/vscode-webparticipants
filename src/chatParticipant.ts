import { Disposable, LanguageModelSystemMessage, LanguageModelUserMessage, chat, lm } from "vscode";
import { WebsiteIndex } from "./websiteIndex";

const GPT_35 = 'copilot-gpt-3.5-turbo';

export function registerChatParticipant(name: string, url: string, index: WebsiteIndex): Disposable {
    const participant = chat.createChatParticipant(name, async (request, context, stream, token) => {
        const chunks = (await index.search(request.prompt, token)).slice(0, 5);
        
        let access;
        try {
            access = await lm.requestLanguageModelAccess(GPT_35);
        } catch(e) {
            access = await lm.requestLanguageModelAccess(lm.languageModels[0]);
        }
        const messages = [
            new LanguageModelSystemMessage(`
You are a helpful assistant specialized in ${url}.
The user will provide context from the website that starts with "Here is potentially useful context: ".
The user will then ask a question.
You must only answer questions using that context and whatever else you know about ${url}.
Do not answer questions that are not related to the context.
`),
            ...chunks.map(c => new LanguageModelUserMessage(`HERE IS POTENTIALLY USEFULE CONTEXT FROM ${url}:\n${c}`)),
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
    return participant;
}