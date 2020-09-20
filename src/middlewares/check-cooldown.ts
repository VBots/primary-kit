import { MessageContext } from 'vk-io';
import { ISession } from '../types';

/**
 * Обработка состояния ожидания
 */
export const checkCooldownMiddleware = () => async (context: MessageContext, next: Function) => {
    const session: ISession = context.session;

    if (session.pendingTime && Date.now() - session.pendingTime * 1e3 < 0) {
        return;
    }

    /**
     * Установить время ожидания
     * @param sec Время ожидания (заморозки) в секундах. [0 - отключение]
     */
    context.setPending = (sec: number = 0) => {
        context.session.pendingTime = sec ? Date.now() + sec * 1e3 : 0;
    };

    await next();
};
