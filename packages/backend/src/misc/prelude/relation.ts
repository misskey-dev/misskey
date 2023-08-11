export type Predicate<T> = (a: T) => boolean;

export type Relation<T, U> = (a: T, b: U) => boolean;

export type EndoRelation<T> = Relation<T, T>;
