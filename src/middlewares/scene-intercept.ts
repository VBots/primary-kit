import { CMenu, checkMenu } from '@vbots/cmenu';
import { IContext } from '@vk-io/session';

/**
 *
 * @param CancelSceneMenu
 * @param ToMenu
 */
export const sceneInterceptMiddleware = (
    CancelSceneMenu: CMenu,
    ToMenu: CMenu,
    ToMenuText: string = 'Сцена отменена.'
) => async (context: IContext, next: Function) => {
    if (!context.scene.current) {
        return next();
    }

    if (checkMenu(CancelSceneMenu, context)) {
        context.sendCM(ToMenu, {}, ToMenuText);

        return context.scene.leave({
            canceled: true,
        });
    }

    return context.scene.reenter();
};
