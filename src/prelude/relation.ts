export type Relation<T, U> = (x: T, y: U) => boolean;

export type EndoRelation<T> = Relation<T, T>;
