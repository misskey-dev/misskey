// https://github.com/bterlson/strict-event-emitter-types

// the overridden signatures need to be assignment compatible, but
// due to how tuple types work[0] it's not possible to be assignment
// compatible anymore. This hack fixes it with a unique symbol that
// won't ever show up in parameter help etc.
//
// Unfortunately, this has the result of giving a poor error message when
// you mix up types.
// 0: https://github.com/Microsoft/TypeScript/issues/26013)
declare const assignmentCompatibilityHack: unique symbol;

// Returns any keys of TRecord with the type of TMatch
export type MatchingKeys<
  TRecord,
  TMatch,
  K extends keyof TRecord = keyof TRecord
> = K extends (TRecord[K] extends TMatch ? K : never) ? K : never;

// Returns any property keys of Record with a void type
export type VoidKeys<Record> = MatchingKeys<Record, void>;

// TODO: Stash under a symbol key once TS compiler bug is fixed
export interface TypeRecord<T, U, V> {
  ' _emitterType'?: T;
  ' _eventsType'?: U;
  ' _emitType'?: V;
}

export type ReturnTypeOfMethod<T> = T extends (...args: any[]) => any
  ? ReturnType<T>
  : void;

export type ReturnTypeOfMethodIfExists<T, S extends string> = S extends keyof T
  ? ReturnTypeOfMethod<T[S]>
  : void;

export type InnerEEMethodReturnType<T, TValue, FValue> = T extends (
  ...args: any[]
) => any
  ? ReturnType<T> extends void | undefined ? FValue : TValue
  : FValue;

export type EEMethodReturnType<
  T,
  S extends string,
  TValue,
  FValue = void
> = S extends keyof T ? InnerEEMethodReturnType<T[S], TValue, FValue> : FValue;

export type ListenerType<T> = [T] extends [(...args: infer U) => any]
  ? U
  : [T] extends [void] ? [] : [T];

// EventEmitter method overrides
export type OverriddenMethods<
  TEmitter,
  TEventRecord,
  TEmitRecord = TEventRecord
> = {
  on<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): EEMethodReturnType<TEmitter, 'on', T>;
  on(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  addListener<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): EEMethodReturnType<TEmitter, 'addListener', T>;
  addListener(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  addEventListener<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): EEMethodReturnType<TEmitter, 'addEventListener', T>;
  addEventListener(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  removeListener<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: any[]) => any
  ): EEMethodReturnType<TEmitter, 'removeListener', T>;
  removeListener(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  removeEventListener<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: any[]) => any
  ): EEMethodReturnType<TEmitter, 'removeEventListener', T>;
  removeEventListener(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  once<P extends keyof TEventRecord, T>(
    this: T,
    event: P,
    listener: (...args: ListenerType<TEventRecord[P]>) => void
  ): EEMethodReturnType<TEmitter, 'once', T>;
  once(
    event: typeof assignmentCompatibilityHack,
    listener: (...args: any[]) => any
  ): void;

  emit<P extends keyof TEmitRecord, T>(
    this: T,
    event: P,
    ...args: ListenerType<TEmitRecord[P]>
  ): EEMethodReturnType<TEmitter, 'emit', T>;
  emit(event: typeof assignmentCompatibilityHack, ...args: any[]): void;
};

export type OverriddenKeys = keyof OverriddenMethods<any, any, any>;

export type StrictEventEmitter<
  TEmitterType,
  TEventRecord,
  TEmitRecord = TEventRecord,
  UnneededMethods extends Exclude<OverriddenKeys, keyof TEmitterType> = Exclude<
    OverriddenKeys,
    keyof TEmitterType
  >,
  NeededMethods extends Exclude<OverriddenKeys, UnneededMethods> = Exclude<
    OverriddenKeys,
    UnneededMethods
  >
> =
  // Store the type parameters we've instantiated with so we can refer to them later
  TypeRecord<TEmitterType, TEventRecord, TEmitRecord> &
    // Pick all the methods on the original type we aren't going to override
    Pick<TEmitterType, Exclude<keyof TEmitterType, OverriddenKeys>> &
    // Finally, pick the needed overrides (taking care not to add an override for a method
    // that doesn't exist)
    Pick<
      OverriddenMethods<TEmitterType, TEventRecord, TEmitRecord>,
      NeededMethods
    >;

export default StrictEventEmitter;

export type NoUndefined<T> = T extends undefined ? never : T;

export type StrictBroadcast<
  TEmitter extends TypeRecord<any, any, any>,
  TEmitRecord extends NoUndefined<TEmitter[' _emitType']> = NoUndefined<
    TEmitter[' _emitType']
  >,
  VK extends VoidKeys<TEmitRecord> = VoidKeys<TEmitRecord>,
  NVK extends Exclude<keyof TEmitRecord, VK> = Exclude<keyof TEmitRecord, VK>
> = {
  <E extends NVK>(event: E, request: TEmitRecord[E]): any;
  <E extends VK>(event: E): any;
};

export type EventNames<
  TEmitter extends TypeRecord<any, any, any>,
  TEventRecord extends NoUndefined<TEmitter[' _eventsType']> = NoUndefined<
    TEmitter[' _eventsType']
  >,
  TEmitRecord extends NoUndefined<TEmitter[' _emitType']> = NoUndefined<
    TEmitter[' _emitType']
  >
> = keyof TEmitRecord | keyof TEventRecord;

export type OnEventNames<
  TEmitter extends TypeRecord<any, any, any>,
  TEventRecord extends NoUndefined<TEmitter[' _eventsType']> = NoUndefined<
    TEmitter[' _eventsType']
  >,
  TEmitRecord extends NoUndefined<TEmitter[' _emitType']> = NoUndefined<
    TEmitter[' _emitType']
  >
> = keyof TEventRecord;

export type EmitEventNames<
  TEmitter extends TypeRecord<any, any, any>,
  TEventRecord extends NoUndefined<TEmitter[' _eventsType']> = NoUndefined<
    TEmitter[' _eventsType']
  >,
  TEmitRecord extends NoUndefined<TEmitter[' _emitType']> = NoUndefined<
    TEmitter[' _emitType']
  >
> = keyof TEmitRecord;
