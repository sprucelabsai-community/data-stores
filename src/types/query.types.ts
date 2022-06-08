/* eslint-disable @typescript-eslint/ban-types */

import { QuerySelector } from '../databases/mongo.types'

type QueryPredicate<Query, K extends keyof Query> =
	| Query[K]
	| QuerySelector<Query[K]>
	| string

type Obj = Record<string, any>

export const saveOperations = [
	'$push',
	'$inc',
	'$min',
	'$max',
	'$mul',
	'$push',
	'$pull',
	'$pop',
] as const

export type SaveOperation = typeof saveOperations[number]
export type SaveOperations = Partial<Record<SaveOperation, Record<string, any>>>

export type QueryBuilder<
	Query extends Obj
	// Flattened = FlattenAndPathKeys<Query>
> = {
	[K in keyof Query]?: QueryPredicate<Query, K>
} & { id?: string | QuerySelector<string> }

export interface QueryOptions {
	skip?: number
	limit?: number
	sort?: { field: string; direction: 'asc' | 'desc' }[]
	includeFields?: string[]
}

export type FlattenAndPathKeys<
	O extends Obj,
	T extends Obj = PathKeys<O>
> = Flatten<T>

export type Flatten<T extends Obj> = Pick<T, NonObjectKeysOf<T>> &
	UnionToIntersection<ObjectValuesOf<T>>

export type PathKeys<Query extends Obj, prefix extends string = ''> = {
	[K in Extract<keyof Query, string> as `${prefix}${K}`]: Query[K] extends Obj
		? PathKeys<Query[K], `${K}.`>
		: Query[K]
}

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
	k: infer I
) => void
	? I
	: never

type ValuesOf<T> = T[keyof T]

// eslint-disable-next-line @typescript-eslint/ban-types
type ObjectValuesOf<T> = Exclude<Extract<ValuesOf<T>, object>, Array<any>>

type NonObjectKeysOf<T> = {
	[K in keyof T]: T[K] extends Array<any> ? K : T[K] extends Obj ? never : K
}[keyof T]
