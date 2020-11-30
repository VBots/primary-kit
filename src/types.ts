import { MessageContext } from 'vk-io';
import { SceneManager, IContext as IContextScene } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';
import { HearManager } from '@vk-io/hear';
import SessionStorage from '@vbots/session-storage';
import { CMenu, CMenuManager, IKeyboardGenerator, ICustomContext as IContextCustom } from '@vbots/cmenu';
import { IProfilerPayload, Profiler } from './models';

export type IContext = MessageContext & IContextScene & IContextCustom;

export interface IInitFull<PF extends typeof Profiler> extends IDefaultSession<PF> {
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

export interface IDefaultSession<PF extends typeof Profiler> {
    defaultMenu?: CMenu;
    callbackDefaultSession?: (context: MessageContext, next: Function) => void;
    useProfiler?: boolean;
    MyProfiler?: PF;
}

export interface ISceneIntercept {
    CancelSceneMenu?: CMenu;
    ToMenu?: CMenu;
    ToMenuText?: string;
}

export interface ISession {
    pendingTime: number;
    menuState: CMenu['cmd'];
    profile: Profiler | IProfilerPayload;

    [key: string]: any;
}
