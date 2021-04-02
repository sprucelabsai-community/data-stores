import { Schema, SchemaPublicValues, SchemaValues } from '@sprucelabs/schema'
import StoreFactory from '../factories/StoreFactory'
import { Database } from './database.types'

export interface StoreOptions {
	db: Database
	storeFactory: StoreFactory
}

export interface Store {
	initialize?(): Promise<void>
}

export interface StoreMap {}
export interface StoreOptionsMap {}

export interface PrepareOptions<IncludePrivateFields extends boolean> {
	includePrivateFields?: IncludePrivateFields
}

export type PrepareResults<
	S extends Schema,
	IncludePrivateFields extends boolean
> = IncludePrivateFields extends true ? SchemaPublicValues<S> : SchemaValues<S>

export type StoreName = keyof StoreMap
