import { Log } from '@sprucelabs/spruce-skill-utils'
import { QueryOptions } from './query.types'

export interface Database {
    [x: string]: any
    syncUniqueIndexes(collectionName: string, indexes: Index[]): Promise<void>
    syncIndexes(collectionName: string, indexes: Index[]): Promise<void>
    dropIndex(collectionName: string, index: Index): Promise<void>
    getUniqueIndexes(collectionName: string): Promise<IndexWithFilter[]>
    getIndexes(collectionName: string): Promise<IndexWithFilter[]>
    isConnected(): boolean
    generateId(): string
    connect(): Promise<void>
    close(): Promise<void>
    getShouldAutoGenerateId?(): boolean
    createOne(
        collection: string,
        values: Record<string, any>,
        options?: CreateOptions
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
        options?: QueryOptions,
        dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any> | null>
    find(
        collection: string,
        query?: Record<string, any>,
        options?: QueryOptions,
        dbOptions?: DatabaseInternalOptions
    ): Promise<Record<string, any>[]>
    updateOne(
        collection: string,
        query: Record<string, any>,
        updates: Record<string, any>,
        dbOptions?: DatabaseInternalOptions
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
    createUniqueIndex(collection: string, index: Index): Promise<void>
    createIndex(collection: string, index: Index): Promise<void>
    query<T>(query: string, params?: any[]): Promise<T[]>
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

export interface IndexWithFilter {
    fields: string[]
    filter?: Record<string, any>
    name?: string
}

export type Index = string[] | IndexWithFilter

export interface CreateOptions extends DatabaseInternalOptions {}

export interface DatabaseInternalOptions {
    primaryFieldNames?: string[]
}
