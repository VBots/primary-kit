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
    public static Create({
        context,
        payload = {},
        MyProfiler = Profiler,
    }: {
        context: Context;
        payload?: IProfilerPayload | any;
        MyProfiler?: typeof Profiler;
    }) {
        return new MyProfiler(context, payload);
    }

    /**
     * Create new instance profiler by `CProfiler` from session data in `payload`
     */
    public static Load({
        context,
        payload = {},
        MyProfiler = Profiler,
    }: {
        context: Context;
        payload: IProfilerPayload | any;
        MyProfiler?: typeof Profiler;
    }) {
        return MyProfiler.Create({ context, payload, MyProfiler: MyProfiler });
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
