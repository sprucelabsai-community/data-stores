import { Log } from '@sprucelabs/spruce-skill-utils'
import { QueryOptions } from './query.types'

export type UniqueIndex = string[]
export type Index = string[]

export interface Database {
	[x: string]: any
	syncUniqueIndexes(
		collectionName: string,
		indexes: UniqueIndex[]
	): Promise<void>
	syncIndexes(collectionName: string, indexes: Index[]): Promise<void>
	dropIndex(collectionName: string, fields: UniqueIndex): Promise<void>
	getUniqueIndexes(collectionName: string): Promise<UniqueIndex[]>
	getIndexes(collectionName: string): Promise<Index[] | UniqueIndex[]>
	isConnected(): boolean
	generateId(): string
	connect(): Promise<void>
	close(): Promise<void>
	createOne(
		collection: string,
		values: Record<string, any>
	): Promise<Record<string, any>>
	create(
		collection: string,
		values: Record<string, any>[]
	): Promise<Record<string, any>[]>
	dropCollection(name: string): Promise<void>
	dropDatabase(): Promise<void>
	findOne(
		collection: string,
		query?: Record<string, any>,
		options?: QueryOptions
	): Promise<Record<string, any> | null>
	find(
		collection: string,
		query?: Record<string, any>,
		options?: QueryOptions
	): Promise<Record<string, any>[]>
	updateOne(
		collection: string,
		query: Record<string, any>,
		updates: Record<string, any>
	): Promise<Record<string, any>>
	update(
		collection: string,
		query: Record<string, any>,
		updates: Record<string, any>
	): Promise<number>
	upsertOne(
		collection: string,
		query: Record<string, any>,
		updates: Record<string, any>
	): Promise<Record<string, any>>
	delete(collection: string, query: Record<string, any>): Promise<number>
	deleteOne(collection: string, query: Record<string, any>): Promise<number>
	count(collection: string, query?: Record<string, any>): Promise<number>
	createUniqueIndex(collection: string, fields: UniqueIndex): Promise<void>
	createIndex(collection: string, fields: Index): Promise<void>
	query<T>(query: string): Promise<T>
}

export interface DatabaseOptions {
	dbName?: string
	log?: Log
}

export type TestConnect = (
	connectionString?: string,
	dbName?: string
) => Promise<{
	db: Database
	scheme: string
	connectionStringWithRandomBadDatabaseName: string
	badDatabaseName: string
}>

export interface DataStorePlugin {
	willCreateOne?: (
		values: Record<string, any>
	) => Promise<void | DataStorePluginWillCreateOneResponse>
	didCreateOne?: (
		record: Record<string, any>
	) => Promise<void | DataStorePluginDidCreateOneResponse>
	willUpdateOne?: (
		query: Record<string, any>,
		updates: Record<string, any>
	) => Promise<void | DataStorePluginWillUpdateOneResponse>
	willDeleteOne?: (
		query: Record<string, any>
	) => Promise<void | DataStorePluginWillDeleteOneResponse>
	didFindOne?: (
		query: Record<string, any>,
		record: Record<string, any>
	) => Promise<void | DataStorePluginDidFindOneResponse>
	getName(): string
}

export interface DataStorePluginDidCreateOneResponse {
	valuesToMixinBeforeReturning?: Record<string, any>
}

export interface DataStorePluginWillCreateOneResponse {
	valuesToMixinBeforeCreate?: Record<string, any>
}

export interface DataStorePluginWillUpdateOneResponse {
	query?: Record<string, any>
	shouldUpdate?: boolean
}

export interface DataStorePluginWillDeleteOneResponse {
	query?: Record<string, any>
}

export interface DataStorePluginDidFindOneResponse {
	valuesToMixinBeforeReturning?: Record<string, any>
}
