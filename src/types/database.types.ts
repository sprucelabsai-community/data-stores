import { QueryOptions } from './query.types'

export type UniqueIndex = string[]

export interface Database {
	syncUniqueIndexes(
		collectionName: string,
		indexes: UniqueIndex[]
	): Promise<void>
	dropIndex(collectionName: string, fields: UniqueIndex): Promise<void>
	getUniqueIndexes(collectionName: string): Promise<UniqueIndex[]>
	isConnected(): boolean
	generateId(): string
	connect(): Promise<void>
	close(): Promise<void>
	normalizePrepareOptions<T extends Record<string, any>>(options: T): T
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
}
