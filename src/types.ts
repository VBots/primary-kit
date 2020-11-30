import { MessageContext, Context } from 'vk-io';
import { HearManager } from '@vk-io/hear';
import { SessionManager } from '@vk-io/session';
import SessionStorage from '@vbots/session-storage';
import { SceneManager, IContext as IContextScene, IStepContext } from '@vk-io/scenes';
import { CMenu, CMenuManager, IKeyboardGenerator, ICustomContext as IContextCustom } from '@vbots/cmenu';
import { /* IProfilerPayload ,*/ Profiler } from './models';

export type SessionInContext<PF extends Profiler> = { session: ISession<PF> };
export type IContext<T = Context, PF extends Profiler = Profiler> = T &
    IContextCustom &
    IContextScene &
    IStepContext &
    SessionInContext<PF>;
export type IMessageContext<PF extends Profiler> = IContext<MessageContext, PF>;

export interface IInitFull<PFT extends typeof Profiler> extends IDefaultSession<PFT> {
    useSession?: boolean;
    useSessionStorage?: boolean;
    useScene?: boolean;
    useHear?: boolean;
    useCMenu?: boolean;
    useSkipOutMessage?: boolean;
    useDefaultSession?: boolean;
    useConversationAppeal?: boolean;
    useCooldown?: boolean;

    menuGenerator?: IKeyboardGenerator;
    storageName?: string;
    sceneIntercept: ISceneIntercept;
}

export interface IKit {
    storage?: SessionStorage;
    sessionManager?: SessionManager;
    hearManager?: HearManager<MessageContext>;
    menuManager?: CMenuManager<MessageContext>;
    sceneManager?: SceneManager;
}

export interface IUsing<PF extends typeof Profiler> {
    session: boolean;
    sessionStorage: boolean;
    scene: boolean;
    hear: boolean;
    CMenu: boolean;
    skipMessage: boolean;
    cooldown: boolean;
    conversationAppeal: boolean;
    defaultSession: IDefaultSession<PF>;
    sceneIntercept: ISceneIntercept;
}

export interface IDefaultSession<PFT extends typeof Profiler> {
    defaultMenu?: CMenu;
    callbackDefaultSession?: (context: MessageContext, next: Function) => void;
    useProfiler?: boolean;
    MyProfiler?: PFT;
}

export interface ISceneIntercept {
    CancelSceneMenu?: CMenu;
    ToMenu?: CMenu;
    ToMenuText?: string;
}

export interface ISession<PF extends Profiler> {
    pendingTime: number;
    menuState: CMenu['cmd'];
    profile: PF /* | IProfilerPayload */;

    [key: string]: any;
}
