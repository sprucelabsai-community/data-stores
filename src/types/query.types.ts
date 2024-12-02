import { PathsWithDotNotation } from '@sprucelabs/schema'
import { QuerySelector, RootQuerySelector } from '../databases/mongo.types'

type Obj = Record<string, any>

export type QueryBuilder<
    Query,
    Keys extends PathsWithDotNotation<Query> = PathsWithDotNotation<Query>,
> = {
    [K in Keys]?: QuerySelector<TypeAtPath<Query, K>> | TypeAtPath<Query, K>
} & { id?: string | QuerySelector<string> } & RootQuerySelector<Query>

type TypeAtPath<T, P extends string> = P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
        ? TypeAtPath<T[K], Rest>
        : any
    : P extends keyof T
      ? T[P]
      : any

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
