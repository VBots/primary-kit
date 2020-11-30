import { VK, MessageContext, Context } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { ISessionManagerOptions, SessionManager } from '@vk-io/session';
import { SceneManager } from '@vk-io/scenes';

import { CMenuManager, KitMenu } from '@vbots/cmenu';
import { SessionStorage } from '@vbots/session-storage';
import { IInitFull, IKit, ISceneIntercept, IUsing } from './types';
import {
    checkConversationAppealMiddleware,
    checkCooldownMiddleware,
    sceneInterceptMiddleware,
    setDefaultSessionMiddleware,
} from './middlewares';
import { Profiler } from './models';

export class PrimaryKit<PF extends Profiler, PFT extends typeof Profiler> {
    vk: VK;
    public generated: boolean = false;

    private kit: IKit = {};
    private using: IUsing<PFT> = {
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
        MyProfiler = Profiler as PFT,
        storageName,
        useHear = true,
        useCMenu = true,
        defaultMenu,
        menuGenerator,
        useSkipOutMessage = true,
        callbackDefaultSession,
        sceneIntercept = {},
    }: IInitFull<PFT>) {
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
    public static Create(vk: VK) {
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
    public UseSessionWithStorage(storageName: IInitFull<PFT>['storageName']) {
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
        return this;
    }

    /**
     * UseHear
     */
    public UseHear() {
        this.using.hear = true;
        this.kit.hearManager = new HearManager<MessageContext>();
        return this;
    }

    /**
     * UseCMenu
     */
    public UseCMenu(menuGenerator: IInitFull<PFT>['menuGenerator']) {
        if (!menuGenerator) {
            throw new Error('menuGenerator is required');
        }
        this.using.CMenu = true;
        this.kit.menuManager = new CMenuManager<MessageContext>(menuGenerator, this.kit.hearManager);
        return this;
    }

    /**
     * Use Skip outbox message and handle errors
     */
    public UseSkipMessage({
        ignoreChat = false,
        ignoreDM = false,
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
                    (context.isDM && ignoreDM) ||
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
        return this;
    }

    /**
     * UseDefaultSession
     */
    public UseDefaultSession({
        defaultMenu,
        callbackDefaultSession,
        useProfiler = true,
        MyProfiler = Profiler as PFT,
    }: Partial<IInitFull<PFT>>) {
        this.using.defaultSession = {
            defaultMenu,
            callbackDefaultSession,
            useProfiler,
            MyProfiler,
        };
        return this;
    }

    /**
     * UseCooldown
     */
    public UseCooldown() {
        this.using.cooldown = true;
        return this;
    }

    /**
     * UseConversationAppeal
     */
    public UseConversationAppeal() {
        this.using.conversationAppeal = true;
        return this;
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
        return this;
    }

    /**
     * Generate
     */
    public Generate() {
        const { vk, kit, using } = this;
        if (this.generated) {
            return this;
        }

        // Handle message payload
        vk.updates.use(async (context, next) => {
            if (context.is(['message'])) {
                const { messagePayload } = context;

                context.state.command = messagePayload?.command;
                context.state.command2 = messagePayload?.command2;
                context.subCmd = context.state.command2;

                // Handle not_supported_button
                if (messagePayload?.command === 'not_supported_button') {
                    context.state.command = KitMenu.Get().NotSupportedBtn.cmd;
                    let payload = JSON.parse(messagePayload.payload);
                    context.state.command2 = payload?.command;
                    context.subCmd = context.state.command2;
                }
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
                setDefaultSessionMiddleware<PF, PFT>({
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
        return this;
    }

    public get kitStorage() {
        return this.kit.storage!;
    }

    public get kitSessionManager() {
        return this.kit.sessionManager!;
    }

    public get kitHearManager() {
        return this.kit.hearManager!;
    }

    public get kitMenuManager() {
        return this.kit.menuManager!;
    }

    public get kitSceneManager() {
        return this.kit.sceneManager!;
    }

    public get Kit(): IKit {
        return this.kit;
    }
}
