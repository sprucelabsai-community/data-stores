import {
	Schema,
	SchemaFieldNames,
	SchemaPublicValues,
	SchemaValues,
} from '@sprucelabs/schema'
import StoreFactory from '../factories/StoreFactory'
import { Database } from './database.types'

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

export type SaveOperation = (typeof saveOperations)[number]
export type SaveOperations = Partial<Record<SaveOperation, Record<string, any>>>

export interface UniversalStoreOptions {
	db: Database
	storeFactory: StoreFactory
}

export interface DataStore {
	initialize?(): Promise<void>
	getCollectionName?(): string
}
/**
 * @deprecated SimplifiedStoreFactory -> SimpleStoreFactory
 */
export type SimplifiedStoreFactory = Pick<StoreFactory, 'getStore'>
export type SimpleStoreFactory = Pick<StoreFactory, 'getStore'>
export interface StoreMap {}
export interface StoreOptionsMap {}

export interface PrepareOptions<
	IncludePrivateFields extends boolean,
	S extends Schema,
	FieldNames extends SchemaFieldNames<S> = SchemaFieldNames<S>,
> {
	shouldIncludePrivateFields?: IncludePrivateFields
	includeFields?: FieldNames[]
	shouldStripUndefinedAndNullValues?: boolean
}

export type PrepareResults<
	S extends Schema,
	IncludePrivateFields extends boolean,
> = IncludePrivateFields extends true ? SchemaPublicValues<S> : SchemaValues<S>

export type StoreName = keyof StoreMap

export type StoreOptions<Name extends StoreName> =
	Name extends keyof StoreOptionsMap
		? StoreOptionsMap[Name]
		: Record<string, never>
