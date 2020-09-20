import { MessageContext } from 'vk-io';
import { SceneManager, IContext as IContextScene } from '@vk-io/scenes';
import { SessionManager } from '@vk-io/session';
import { HearManager } from '@vk-io/hear';
import SessionStorage from '@vbots/session-storage';
import { CMenu, CMenuManager, IKeyboardGenerator, ICustomContext as IContextCustom } from '@vbots/cmenu';
import { IProfilerPayload, Profiler } from './models';

export type IContext = MessageContext & IContextScene & IContextCustom;

export interface IInitFull {
    useSession?: boolean;
    useSessionStorage?: boolean;
    storageName?: string;

    useDefaultSession?: boolean;
    useConversationAppeal?: boolean;
    useCooldown?: boolean;
    useProfiler?: boolean;
    MyProfiler?: typeof Profiler;

    useHear?: boolean;
    useCMenu?: boolean;
    defaultMenu?: CMenu;
    menuGenerator?: IKeyboardGenerator;

    useSkipOutMessage?: boolean;
    callbackDefaultSession?: (context: MessageContext, next: Function) => void;

    useScene?: boolean;
    sceneIntercept: {
        CancelSceneMenu?: CMenu;
        ToMenu?: CMenu;
        ToMenuText?: string;
    };
}

export interface IKit {
    storage?: SessionStorage;
    sessionManager?: SessionManager;
    hearManager?: HearManager<MessageContext>;
    menuManager?: CMenuManager<MessageContext>;
    sceneManager?: SceneManager;
}

export interface ISession {
    pendingTime: number;
    menuState: CMenu['cmd'];
    profile: Profiler | IProfilerPayload;

    [key: string]: any;
}
