import { CMenu, cmdMenu } from '@vbots/cmenu';
import { Profiler } from '../models';
import { IMessageContext } from '../types';

/**
 * Установка значений в сессии по умолчанию
 * @param defaultMenu Состояние меню по умолчанию
 * @param callback Колбэк постобработки для сессии
 */
export const setDefaultSessionMiddleware = <PF extends Profiler, PFT extends typeof Profiler>({
    defaultMenu,
    callback,
    useProfiler,
    MyProfiler,
}: {
    defaultMenu?: CMenu;
    callback?: Function;
    useProfiler: boolean;
    MyProfiler?: PFT;
}) => async (context: IMessageContext<PF>, next: Function) => {
    const session = context.session;

    if (defaultMenu && !('menuState' in session)) {
        session.menuState = cmdMenu(defaultMenu);
    }

    if (!('pendingTime' in session)) {
        session.pendingTime = 0;
    }

    if (useProfiler) {
        if (!(MyProfiler instanceof Profiler)) {
            throw new Error('MyProfiler not instance of Profiler');
        }

        // Генерация нового профиля, если его еще не было
        if (!('profile' in session)) {
            session.profile = MyProfiler.Create({ context, MyProfiler });
        } else if (!MyProfiler.IsProfiler(session.profile) && session.profile.peerId) {
            session.profile = MyProfiler.Load({ context, MyProfiler, payload: session.profile });
        }
    }

    if (typeof callback === 'function') {
        callback(context, next);
    }

    await next();
};
