import { QuerySelector, RootQuerySelector } from '../databases/mongo.types'

type Obj = Record<string, any>

export type QueryBuilder<Query, Keys extends Paths<Query> = Paths<Query>> = {
    [K in Keys]?: QuerySelector<TypeAtPath<Query, K>> | TypeAtPath<Query, K>
} & { id?: string | QuerySelector<string> } & RootQuerySelector<Query>

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

export type PathKeys<Query extends Obj, Prefix extends string = ''> = {
    [K in Extract<keyof Query, string> as `${Prefix}${K}`]: Query[K] extends Obj
        ? PathKeys<Query[K], `${K}.`>
        : Query[K]
}

type Join<K, P> = K extends string | number
    ? P extends string | number
        ? `${K}${'' extends P ? '' : '.'}${P}`
        : never
    : never

type Prev = [
    never,
    0,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
    11,
    12,
    13,
    14,
    15,
    16,
    17,
    18,
    19,
    20,
    ...0[],
]

type Paths<T, D extends number = 3> = [D] extends [never]
    ? never
    : T extends object
      ? {
            [K in keyof T]-?: K extends string | number
                ? `${K}` | Join<K, Paths<T[K], Prev[D]>>
                : never
        }[keyof T]
      : ''

type TypeAtPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? TypeAtPath<T[K], Rest>
        : any
    : P extends keyof T
      ? T[P]
      : any
