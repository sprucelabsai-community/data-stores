import { QuerySelector } from '../databases/mongo.types'

type QueryPredicate<Query, K extends keyof Query> =
    | Query[K]
    | QuerySelector<Query[K]>
    | string

type Obj = Record<string, any>

export type QueryBuilder<
    Query,
    // Flattened = FlattenAndPathKeys<Query>
> = {
    [K in keyof Query]?: QueryPredicate<Query, K>
} & { id?: string | QuerySelector<string> }

export interface QuerySortField {
    field: string
    direction: 'asc' | 'desc'
}

export interface QueryOptions {
    skip?: number
    limit?: number
    sort?: QuerySortField[]
    includeFields?: string[]
}

export type FlattenAndPathKeys<
    O extends Obj,
    T extends Obj = PathKeys<O>,
> = Flatten<T>

export type Flatten<T extends Obj> = Pick<T, NonObjectKeysOf<T>> &
    UnionToIntersection<ObjectValuesOf<T>>

export type PathKeys<Query extends Obj, Prefix extends string = ''> = {
    [K in Extract<keyof Query, string> as `${Prefix}${K}`]: Query[K] extends Obj
        ? PathKeys<Query[K], `${K}.`>
        : Query[K]
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I
) => void
    ? I
    : never

type ValuesOf<T> = T[keyof T]

type ObjectValuesOf<T> = Exclude<Extract<ValuesOf<T>, object>, any[]>

type NonObjectKeysOf<T> = {
    [K in keyof T]: T[K] extends any[] ? K : T[K] extends Obj ? never : K
}[keyof T]
