import { Context } from 'vk-io';

export interface IProfilerPayload {
    peerId: number;
}

export class Profiler {
    /**
     * Destination identifier
     */
    public peerId: number;

    /**
     * Конструктор главного экземпляра профайлера
     */
    constructor(context: Context, payload: IProfilerPayload = { peerId: 0 }) {
        this.peerId = payload.peerId || context.isChat ? context.senderId : context.userId || context.peerId;
    }

    /**
     * Create new instance profiler by `CProfiler`
     */
    public static Create<PF extends Profiler, PFT extends typeof Profiler>({
        context,
        payload = {},
        MyProfiler = Profiler as PFT,
    }: {
        context: Context;
        payload?: IProfilerPayload | any;
        MyProfiler?: PFT;
    }) {
        return new MyProfiler(context, payload) as PF;
    }

    /**
     * Create new instance profiler by `CProfiler` from session data in `payload`
     */
    public static Load<PF extends Profiler, PFT extends typeof Profiler>({
        context,
        payload = {},
        MyProfiler = Profiler as PFT,
    }: {
        context: Context;
        payload: IProfilerPayload | any;
        MyProfiler?: PFT;
    }) {
        return MyProfiler.Create({ context, payload, MyProfiler: MyProfiler }) as PF;
    }

    /**
     * Check the payload for compliance structure
     */
    public static CheckPaylaod(payload: IProfilerPayload) {
        return !!payload.peerId;
    }

    /**
     * Является ли этот объект произваодным от этого класса
     */
    public static IsProfiler(profile: any) {
        return profile instanceof Profiler;
    }

    public toJSON() {
        return {
            ...this.SerializeData(),
            __generatingTime: Date.now(),
        };
    }

    /**
     * Serialize Profiler data
     */
    public SerializeData(): IProfilerPayload {
        return {
            peerId: this.peerId,
        };
    }

    static [Symbol.hasInstance](obj: typeof Profiler) {
        return obj && 'IsProfiler' in obj;
    }
}
