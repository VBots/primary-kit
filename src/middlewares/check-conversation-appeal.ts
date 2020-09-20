import { VK, MessageContext } from 'vk-io';

/**
 * Обработка обращения к группе (боту) в чате.
 * Удаляет часть обращения в `context.text` и устанавливает состояние `context.state.appeal`
 * @param vk Главный экземпляр класса ВК
 */
export const checkConversationAppealMiddleware = (vk: VK) => async (context: MessageContext, next: Function) => {
    const { text } = context;
    // @ts-ignore
    const groupId = vk.updates.options.pollingGroupId;

    if (groupId) {
        const RegExpAppealGroup = new RegExp(`^\\[club${groupId}\\|(.*?)\\](,|) `, 'i');
        context.state.appeal = false;

        if (text && RegExpAppealGroup.test(text)) {
            const triggerMsg = text.match(RegExpAppealGroup)!;
            context.text = text.slice(triggerMsg[0].length);
            context.state.appeal = true;
        }
    }

    await next();
};
