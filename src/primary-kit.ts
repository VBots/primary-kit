import { VK, MessageContext, Context } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SessionManager } from '@vk-io/session';
import { SceneManager } from '@vk-io/scenes';

import { CMenuManager } from '@vbots/cmenu';
import { SessionStorage } from '@vbots/session-storage';
import { IInitFull, IKit } from './types';
import {
    checkConversationAppealMiddleware,
    checkCooldownMiddleware,
    sceneInterceptMiddleware,
    setDefaultSessionMiddleware,
} from './middlewares';
import { Profiler } from './models';

export class PrimaryKit {
    vk: VK;
    private kit: IKit = {};

    constructor(vk: VK) {
        this.vk = vk;
    }

    /**
     * Init
     */
    public InitFull({
        useSession = true,
        useSessionStorage = true,
        useScene = true,
        useDefaultSession = true,
        useConversationAppeal = true,
        useCooldown = true,
        useProfiler = true,
        MyProfiler = Profiler,
        storageName,
        useHear = true,
        useCMenu = true,
        defaultMenu,
        menuGenerator,
        useSkipOutMessage = true,
        callbackDefaultSession,
        sceneIntercept: { CancelSceneMenu, ToMenu, ToMenuText } = {},
    }: IInitFull) {
        const { vk, kit } = this;

        if (useSession || useSessionStorage) {
            if (useSessionStorage) {
                kit.storage = new SessionStorage({ name: storageName });
                kit.sessionManager = new SessionManager({
                    storage: kit.storage,
                    getStorageKey: (context: Context) => `${context.peerId}_${context.senderId || context.userId}`,
                });
            } else {
                kit.sessionManager = new SessionManager();
            }
        }

        if (useScene) {
            kit.sceneManager = new SceneManager();
        }

        if (useHear) {
            kit.hearManager = new HearManager<MessageContext>();
        }

        if (useCMenu) {
            if (!menuGenerator) {
                throw new Error('menuGenerator is required');
            }
            kit.menuManager = new CMenuManager<MessageContext>(menuGenerator, useHear ? kit.hearManager : undefined);
        }

        if (useSkipOutMessage) {
            // Skip outbox message and handle errors
            vk.updates.use(async (context, next) => {
                if (context.is(['message']) && (context.senderId < 1 || context.isOutbox)) {
                    return;
                }

                try {
                    await next();
                } catch (error) {
                    console.error('Error:', error);
                }
            });
        }

        // Handle message payload
        vk.updates.use(async (context, next) => {
            if (context.is(['message'])) {
                const { messagePayload } = context;

                context.state.command = messagePayload && messagePayload.command ? messagePayload.command : null;
                context.state.command2 =
                    messagePayload && messagePayload.command2 !== undefined ? messagePayload.command2 : undefined;
                context.subCmd = context.state.command2;
            }

            await next();
        });

        if (useSession || useSessionStorage) {
            vk.updates.use(kit.sessionManager!.middleware);
        }

        if (useDefaultSession) {
            // Set default session
            vk.updates.use(
                setDefaultSessionMiddleware({ defaultMenu, callback: callbackDefaultSession, useProfiler, MyProfiler })
            );
        }

        if (useCooldown) {
            vk.updates.on('message', checkCooldownMiddleware());
        }

        if (useConversationAppeal) {
            vk.updates.on('message', checkConversationAppealMiddleware(vk));
        }

        if (useScene) {
            vk.updates.on('message_new', kit.sceneManager!.middleware);
        }

        if (useCMenu) {
            vk.updates.on('message_new', kit.menuManager!.middleware);
        }

        if (useScene) {
            // Default scene entry handler
            vk.updates.on(
                'message_new',
                CancelSceneMenu && ToMenu
                    ? sceneInterceptMiddleware(CancelSceneMenu, ToMenu, ToMenuText)
                    : kit.sceneManager!.middlewareIntercept
            );
        }

        if (useHear) {
            vk.updates.on('message_new', kit.hearManager!.middleware);
        }
    }

    public get Kit(): IKit {
        return this.kit;
    }
}
