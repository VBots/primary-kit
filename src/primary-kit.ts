import { VK, MessageContext, Context } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { ISessionManagerOptions, SessionManager } from '@vk-io/session';
import { SceneManager } from '@vk-io/scenes';

import { CMenuManager } from '@vbots/cmenu';
import { SessionStorage } from '@vbots/session-storage';
import { IInitFull, IKit, ISceneIntercept, IUsing } from './types';
import {
    checkConversationAppealMiddleware,
    checkCooldownMiddleware,
    sceneInterceptMiddleware,
    setDefaultSessionMiddleware,
} from './middlewares';
import { Profiler } from './models';

export class PrimaryKit<PF extends typeof Profiler> {
    vk: VK;
    public generated: boolean = false;

    private kit: IKit = {};
    private using: IUsing<PF> = {
        session: false,
        sessionStorage: false,
        scene: false,
        hear: false,
        CMenu: false,
        skipMessage: false,
        cooldown: false,
        conversationAppeal: false,
        defaultSession: {},
        sceneIntercept: {},
    };

    constructor(vk: VK) {
        this.vk = vk;
    }

    /**
     * Init full
     */
    public InitFull({
        useSession = true,
        useSessionStorage = true,
        useScene = true,
        useDefaultSession = true,
        useConversationAppeal = true,
        useCooldown = true,
        useProfiler = true,
        MyProfiler = Profiler as PF,
        storageName,
        useHear = true,
        useCMenu = true,
        defaultMenu,
        menuGenerator,
        useSkipOutMessage = true,
        callbackDefaultSession,
        sceneIntercept = {},
    }: IInitFull<PF>) {
        if (useSession || useSessionStorage) {
            if (useSessionStorage) {
                this.UseSessionWithStorage(storageName);
            } else {
                this.UseSession();
            }
        }

        if (useScene) {
            this.UseScene();
        }

        if (useHear) {
            this.UseHear();
        }

        if (useCMenu) {
            this.UseCMenu(menuGenerator);
        }

        if (useSkipOutMessage) {
            this.UseSkipMessage();
        }

        if (useDefaultSession) {
            this.UseDefaultSession({
                defaultMenu,
                callbackDefaultSession,
                useProfiler,
                MyProfiler,
            });
        }

        if (useCooldown) {
            this.UseCooldown();
        }

        if (useConversationAppeal) {
            this.UseConversationAppeal();
        }

        this.UseSceneIntercept(sceneIntercept);

        this.Generate();
    }

    /**
     * Create
     */
    public Create(vk: VK) {
        return new PrimaryKit(vk);
    }

    /**
     * UseSession
     */
    public UseSession(options?: Partial<ISessionManagerOptions<{}>>) {
        this.using.session = true;
        this.kit.sessionManager = new SessionManager(options);
        return this;
    }

    /**
     * UseSessionStorage
     */
    public UseSessionWithStorage(storageName: IInitFull<PF>['storageName']) {
        const { kit } = this;
        this.using.sessionStorage = true;
        kit.storage = new SessionStorage({ name: storageName });
        this.UseSession({
            storage: kit.storage,
            getStorageKey: (context: Context) => `${context.peerId}_${context.senderId || context.userId}`,
        });
        return this;
    }

    /**
     * UseScene
     */
    public UseScene() {
        this.using.scene = true;
        this.kit.sceneManager = new SceneManager();
    }

    /**
     * UseHear
     */
    public UseHear() {
        this.using.hear = true;
        this.kit.hearManager = new HearManager<MessageContext>();
    }

    /**
     * UseCMenu
     */
    public UseCMenu(menuGenerator: IInitFull<PF>['menuGenerator']) {
        if (!menuGenerator) {
            throw new Error('menuGenerator is required');
        }
        this.using.CMenu = true;
        this.kit.menuManager = new CMenuManager<MessageContext>(menuGenerator, this.kit.hearManager);
    }

    /**
     * Use Skip outbox message and handle errors
     */
    public UseSkipMessage({
        ignoreChat = false,
        ignoreUser = false,
        ignoreFromUser = false,
        ignoreGroup = false,
        ignoreFromGroup = false,
    } = {}) {
        this.using.skipMessage = true;
        this.vk.updates.use(async (context: MessageContext, next) => {
            if (context.is(['message'])) {
                if (
                    context.isOutbox ||
                    (context.isChat && ignoreChat) ||
                    (context.isFromUser && ignoreUser) ||
                    (context.isUser && ignoreFromUser) ||
                    (context.isGroup && ignoreGroup) ||
                    (context.isFromGroup && ignoreFromGroup)
                ) {
                    return;
                }
            }

            try {
                await next();
            } catch (error) {
                console.error('Error:', error);
            }
        });
    }

    /**
     * UseDefaultSession
     */
    public UseDefaultSession({
        defaultMenu,
        callbackDefaultSession,
        useProfiler = true,
        MyProfiler = Profiler as PF,
    }: Partial<IInitFull<PF>>) {
        this.using.defaultSession = {
            defaultMenu,
            callbackDefaultSession,
            useProfiler,
            MyProfiler,
        };
    }

    /**
     * UseCooldown
     */
    public UseCooldown() {
        this.using.cooldown = true;
    }

    /**
     * UseConversationAppeal
     */
    public UseConversationAppeal() {
        this.using.conversationAppeal = true;
    }

    /**
     * UseSceneIntercept
     */
    public UseSceneIntercept({ CancelSceneMenu, ToMenu, ToMenuText }: ISceneIntercept) {
        this.using.sceneIntercept = {
            CancelSceneMenu,
            ToMenu,
            ToMenuText,
        };
    }

    /**
     * Generate
     */
    public Generate() {
        const { vk, kit, using } = this;
        if (this.generated) {
            return;
        }

        // Handle message payload
        vk.updates.use(async (context, next) => {
            if (context.is(['message'])) {
                const { messagePayload } = context;

                context.state.command = messagePayload?.command;
                context.state.command2 = messagePayload?.command2;
                context.subCmd = context.state.command2;
            }

            await next();
        });

        if (using.session) {
            vk.updates.use(kit.sessionManager!.middleware);
        }

        if (!!using.defaultSession) {
            const { defaultMenu, callbackDefaultSession, useProfiler, MyProfiler } = using.defaultSession;
            // Set default session
            vk.updates.use(
                setDefaultSessionMiddleware({
                    defaultMenu,
                    callback: callbackDefaultSession,
                    useProfiler: useProfiler as boolean,
                    MyProfiler,
                })
            );
        }

        if (using.cooldown) {
            vk.updates.on('message', checkCooldownMiddleware());
        }

        if (using.conversationAppeal) {
            vk.updates.on('message', checkConversationAppealMiddleware(vk));
        }

        if (using.scene) {
            vk.updates.on('message_new', kit.sceneManager!.middleware);
        }

        if (using.CMenu) {
            vk.updates.on('message_new', kit.menuManager!.middleware);
        }

        if (using.scene) {
            const { CancelSceneMenu, ToMenu, ToMenuText } = using.sceneIntercept;
            // Default scene entry handler
            vk.updates.on(
                'message_new',
                CancelSceneMenu && ToMenu
                    ? sceneInterceptMiddleware(CancelSceneMenu, ToMenu, ToMenuText)
                    : kit.sceneManager!.middlewareIntercept
            );
        }

        if (using.hear) {
            vk.updates.on('message_new', kit.hearManager!.middleware);
        }

        this.generated = true;
    }

    public get Kit(): IKit {
        return this.kit;
    }
}
