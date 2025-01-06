import * as pino from 'pino';
import { pino as pino$1, ChildLoggerOptions, LoggerOptions, DestinationStream } from 'pino';
import { FrameworkError } from '../errors.js';
import { Serializable } from '../internals/serializable.js';
import { EnumFromUnion, ValueOf } from '../internals/types.js';
import '../internals/helpers/guards.js';

interface LoggerBindings extends Record<string, any> {
}
declare class LoggerError extends FrameworkError {
}
declare const LoggerLevel: EnumFromUnion<pino$1.LevelWithSilent>;
type LoggerLevelType = ValueOf<typeof LoggerLevel>;
interface LoggerInput {
    name?: string;
    bindings?: LoggerBindings;
    level?: LoggerLevelType;
    raw?: ChildLoggerOptions;
}
declare class Logger extends Serializable implements pino$1.BaseLogger {
    readonly input: LoggerInput;
    protected raw: pino$1.Logger;
    info: pino$1.LogFn;
    warn: pino$1.LogFn;
    fatal: pino$1.LogFn;
    error: pino$1.LogFn;
    debug: pino$1.LogFn;
    trace: pino$1.LogFn;
    silent: pino$1.LogFn;
    get level(): LoggerLevelType;
    set level(value: LoggerLevelType);
    constructor(input: LoggerInput, raw?: pino$1.Logger);
    static of(input: LoggerInput): Logger;
    private init;
    static get root(): Logger;
    static get defaults(): Omit<LoggerInput, "raw"> & {
        pretty: boolean;
    };
    child(input?: LoggerInput): Logger;
    createSnapshot(): {
        input: LoggerInput;
        level: pino$1.LevelWithSilentOrString;
    };
    loadSnapshot({ level, ...extra }: ReturnType<typeof this.createSnapshot>): void;
    static createRaw(options?: LoggerOptions, stream?: DestinationStream | undefined): pino.Logger<never, boolean>;
}

export { Logger, type LoggerBindings, LoggerError, type LoggerInput, LoggerLevel, type LoggerLevelType };
