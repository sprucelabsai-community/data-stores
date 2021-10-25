import {
	Schema,
	SchemaFieldNames,
	SchemaPublicValues,
	SchemaValues,
} from '@sprucelabs/schema'
import StoreFactory from '../factories/StoreFactory'
import { Database } from './database.types'

export interface UniversalStoreOptions {
	db: Database
	storeFactory: StoreFactory
}

export interface Store {
	initialize?(): Promise<void>
}

export interface StoreMap {}
export interface StoreOptionsMap {}

export interface PrepareOptions<
	IncludePrivateFields extends boolean,
	S extends Schema,
	FieldNames extends SchemaFieldNames<S> = SchemaFieldNames<S>
> {
	shouldIncludePrivateFields?: IncludePrivateFields
	includeFields?: FieldNames[]
}

export type PrepareResults<
	S extends Schema,
	IncludePrivateFields extends boolean
> = IncludePrivateFields extends true ? SchemaPublicValues<S> : SchemaValues<S>

export type StoreName = keyof StoreMap

export type StoreOptions<Name extends StoreName> =
	Name extends keyof StoreOptionsMap
		? StoreOptionsMap[Name]
		: Record<string, never>
