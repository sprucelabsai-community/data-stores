import {
    Schema,
    SchemaFieldNames,
    SchemaPublicValues,
    SchemaValues,
} from '@sprucelabs/schema'
import StoreFactory from '../factories/StoreFactory'
import { FullQueryOptions } from '../stores/AbstractStore'
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
    getDb?(): Database
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
    excludeFields?: FieldNames[]
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

export interface DataStorePlugin {
    willCreateOne?: (
        values: Record<string, any>
    ) => Promise<void | DataStorePluginWillCreateOneResponse>
    didCreateOne?: (
        record: Record<string, any>
    ) => Promise<void | DataStorePluginDidCreateOneResponse>
    willUpdate?: (
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
    prepareRecord?: (
        record: Record<string, any>
    ) => Promise<void | DataStorePluginPrepareResponse>
    willFind?: (
        query: Record<string, any>,
        options?: FullQueryOptions
    ) => Promise<void | DataStorePluginWillFindResponse>
}

export interface DataStorePluginPrepareResponse {
    newValues?: Record<string, any>
}

export interface DataStorePluginDidCreateOneResponse {
    valuesToMixinBeforeReturning?: Record<string, any>
}

export interface DataStorePluginWillCreateOneResponse {
    valuesToMixinBeforeCreate?: Record<string, any>
    newValues?: Record<string, any>
}

export interface DataStorePluginWillUpdateOneResponse {
    query?: Record<string, any>
    shouldUpdate?: boolean
    newUpdates?: Record<string, any>
}

export interface DataStorePluginWillDeleteOneResponse {
    query?: Record<string, any>
}

export interface DataStorePluginDidFindOneResponse {
    valuesToMixinBeforeReturning?: Record<string, any>
}

export interface DataStorePluginWillFindResponse {
    query?: Record<string, any>
    options?: FullQueryOptions
}
