import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'



















import AbstractSpruceError from '@sprucelabs/error'
import { FailedToLoadStoreErrorOptions } from '#spruce/errors/options.types'








export declare namespace SpruceErrors.DataStores {

	
	export interface UnknownStoreError {
		
			/** Action. e.g. createPerson, updateLocation, etc */
			'action': string
			/** Store name. */
			'storeName': string
	}

	export interface UnknownStoreErrorSchema extends SpruceSchema.Schema {
		id: 'unknownStoreError',
		namespace: 'DataStores',
		name: 'Unknown store error',
		    fields: {
		            /** Action. e.g. createPerson, updateLocation, etc */
		            'action': {
		                label: 'Action',
		                type: 'text',
		                isRequired: true,
		                hint: 'e.g. createPerson, updateLocation, etc',
		                options: undefined
		            },
		            /** Store name. */
		            'storeName': {
		                label: 'Store name',
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type UnknownStoreErrorEntity = SchemaEntity<SpruceErrors.DataStores.UnknownStoreErrorSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface UnknownError {
		
	}

	export interface UnknownErrorSchema extends SpruceSchema.Schema {
		id: 'unknownError',
		namespace: 'DataStores',
		name: 'Unknown Error',
		    fields: {
		    }
	}

	export type UnknownErrorEntity = SchemaEntity<SpruceErrors.DataStores.UnknownErrorSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface UnknownDatabaseError {
		
			
			'databaseErrorMessage': string
	}

	export interface UnknownDatabaseErrorSchema extends SpruceSchema.Schema {
		id: 'unknownDatabaseError',
		namespace: 'DataStores',
		name: 'unknown database error',
		    fields: {
		            /** . */
		            'databaseErrorMessage': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type UnknownDatabaseErrorEntity = SchemaEntity<SpruceErrors.DataStores.UnknownDatabaseErrorSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface UnableToConnectToDb {
		
	}

	export interface UnableToConnectToDbSchema extends SpruceSchema.Schema {
		id: 'unableToConnectToDb',
		namespace: 'DataStores',
		name: 'Unable to connect to db',
		    fields: {
		    }
	}

	export type UnableToConnectToDbEntity = SchemaEntity<SpruceErrors.DataStores.UnableToConnectToDbSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface ScrambleNotConfigured {
		
	}

	export interface ScrambleNotConfiguredSchema extends SpruceSchema.Schema {
		id: 'scrambleNotConfigured',
		namespace: 'DataStores',
		name: 'Scramble not configured',
		    fields: {
		    }
	}

	export type ScrambleNotConfiguredEntity = SchemaEntity<SpruceErrors.DataStores.ScrambleNotConfiguredSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface RecordNotFoundQuery {
			/** . */
			[field:string]: any| undefined | null
	}

	export interface RecordNotFoundQuerySchema extends SpruceSchema.Schema {
		id: 'record-not-found-query',
		namespace: 'DataStores',
		name: 'Search query',
		dynamicFieldSignature: { 
		    type: 'raw',
		    keyName: 'field',
		    options: {valueType: `any`,}
		},	}

	export type RecordNotFoundQueryEntity = SchemaEntity<SpruceErrors.DataStores.RecordNotFoundQuerySchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface RecordNotFound {
		
			/** Store name. */
			'storeName': string
			/** Query. */
			'query': SpruceErrors.DataStores.RecordNotFoundQuery
	}

	export interface RecordNotFoundSchema extends SpruceSchema.Schema {
		id: 'recordNotFound',
		namespace: 'DataStores',
		name: 'Record not found',
		    fields: {
		            /** Store name. */
		            'storeName': {
		                label: 'Store name',
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** Query. */
		            'query': {
		                label: 'Query',
		                type: 'schema',
		                isRequired: true,
		                options: {schema: SpruceErrors.DataStores.RecordNotFoundQuerySchema,}
		            },
		    }
	}

	export type RecordNotFoundEntity = SchemaEntity<SpruceErrors.DataStores.RecordNotFoundSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface QueryNotFaked {
		
			
			'query': string
			
			'params'?: Record<string, any> | undefined | null
	}

	export interface QueryNotFakedSchema extends SpruceSchema.Schema {
		id: 'queryNotFaked',
		namespace: 'DataStores',
		name: 'Query not faked',
		    fields: {
		            /** . */
		            'query': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'params': {
		                type: 'raw',
		                options: {valueType: `Record<string, any>`,}
		            },
		    }
	}

	export type QueryNotFakedEntity = SchemaEntity<SpruceErrors.DataStores.QueryNotFakedSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface NotImplemented {
		
	}

	export interface NotImplementedSchema extends SpruceSchema.Schema {
		id: 'notImplemented',
		namespace: 'DataStores',
		name: 'Not implemented',
		    fields: {
		    }
	}

	export type NotImplementedEntity = SchemaEntity<SpruceErrors.DataStores.NotImplementedSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface MongoIdMappingError {
		
	}

	export interface MongoIdMappingErrorSchema extends SpruceSchema.Schema {
		id: 'mongoIdMappingError',
		namespace: 'DataStores',
		name: 'Mongo id mapping error',
		    fields: {
		    }
	}

	export type MongoIdMappingErrorEntity = SchemaEntity<SpruceErrors.DataStores.MongoIdMappingErrorSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidStoreName {
		
			
			'suppliedName': string
			
			'validNames': string[]
	}

	export interface InvalidStoreNameSchema extends SpruceSchema.Schema {
		id: 'invalidStoreName',
		namespace: 'DataStores',
		name: 'Invalid store',
		    fields: {
		            /** . */
		            'suppliedName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'validNames': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidStoreNameEntity = SchemaEntity<SpruceErrors.DataStores.InvalidStoreNameSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidStore {
		
	}

	export interface InvalidStoreSchema extends SpruceSchema.Schema {
		id: 'invalidStore',
		namespace: 'DataStores',
		name: 'Invalid store',
		    fields: {
		    }
	}

	export type InvalidStoreEntity = SchemaEntity<SpruceErrors.DataStores.InvalidStoreSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidFakeQueryResponse {
		
			
			'query': string
			
			'response': any
	}

	export interface InvalidFakeQueryResponseSchema extends SpruceSchema.Schema {
		id: 'invalidFakeQueryResponse',
		namespace: 'DataStores',
		name: 'Invalid fake query response',
		    fields: {
		            /** . */
		            'query': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'response': {
		                type: 'raw',
		                isRequired: true,
		                options: {valueType: `any`,}
		            },
		    }
	}

	export type InvalidFakeQueryResponseEntity = SchemaEntity<SpruceErrors.DataStores.InvalidFakeQueryResponseSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidDbConnectionString {
		
	}

	export interface InvalidDbConnectionStringSchema extends SpruceSchema.Schema {
		id: 'invalidDbConnectionString',
		namespace: 'DataStores',
		name: 'Invalid db connection string',
		    fields: {
		    }
	}

	export type InvalidDbConnectionStringEntity = SchemaEntity<SpruceErrors.DataStores.InvalidDbConnectionStringSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidDatabaseName {
		
			
			'suppliedName': string
	}

	export interface InvalidDatabaseNameSchema extends SpruceSchema.Schema {
		id: 'invalidDatabaseName',
		namespace: 'DataStores',
		name: 'Invalid database name',
		    fields: {
		            /** . */
		            'suppliedName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidDatabaseNameEntity = SchemaEntity<SpruceErrors.DataStores.InvalidDatabaseNameSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface InvalidConnectionStringScheme {
		
			
			'connectionString': string
	}

	export interface InvalidConnectionStringSchemeSchema extends SpruceSchema.Schema {
		id: 'invalidConnectionStringScheme',
		namespace: 'DataStores',
		name: 'Invalid connection string scheme',
		    fields: {
		            /** . */
		            'connectionString': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type InvalidConnectionStringSchemeEntity = SchemaEntity<SpruceErrors.DataStores.InvalidConnectionStringSchemeSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface IndexNotFound {
		
			/** Missing Index. */
			'missingIndex': string[]
			
			'collectionName': string
	}

	export interface IndexNotFoundSchema extends SpruceSchema.Schema {
		id: 'indexNotFound',
		namespace: 'DataStores',
		name: 'Index not found',
		    fields: {
		            /** Missing Index. */
		            'missingIndex': {
		                label: 'Missing Index',
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		            /** . */
		            'collectionName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type IndexNotFoundEntity = SchemaEntity<SpruceErrors.DataStores.IndexNotFoundSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface IndexExists {
		
			/** Index Exists. */
			'index': string[]
			
			'collectionName': string
	}

	export interface IndexExistsSchema extends SpruceSchema.Schema {
		id: 'indexExists',
		namespace: 'DataStores',
		name: 'Index Exists',
		    fields: {
		            /** Index Exists. */
		            'index': {
		                label: 'Index Exists',
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		            /** . */
		            'collectionName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type IndexExistsEntity = SchemaEntity<SpruceErrors.DataStores.IndexExistsSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface FailedToLoadStores {
		
			
			'errors': AbstractSpruceError<FailedToLoadStoreErrorOptions>[]
	}

	export interface FailedToLoadStoresSchema extends SpruceSchema.Schema {
		id: 'failedToLoadStores',
		namespace: 'DataStores',
		name: 'failed to load stores',
		    fields: {
		            /** . */
		            'errors': {
		                type: 'raw',
		                isRequired: true,
		                isArray: true,
		                options: {valueType: `AbstractSpruceError<FailedToLoadStoreErrorOptions>`,}
		            },
		    }
	}

	export type FailedToLoadStoresEntity = SchemaEntity<SpruceErrors.DataStores.FailedToLoadStoresSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface FailedToLoadStore {
		
			
			'name': string
	}

	export interface FailedToLoadStoreSchema extends SpruceSchema.Schema {
		id: 'failedToLoadStore',
		namespace: 'DataStores',
		name: 'Failed to load store',
		    fields: {
		            /** . */
		            'name': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type FailedToLoadStoreEntity = SchemaEntity<SpruceErrors.DataStores.FailedToLoadStoreSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface DuplicateRecord {
		
			
			'duplicateFields': string[]
			
			'duplicateValues': string[]
			
			'collectionName': string
			/** Action. e.g. create, update, etc. */
			'action': string
	}

	export interface DuplicateRecordSchema extends SpruceSchema.Schema {
		id: 'duplicateRecord',
		namespace: 'DataStores',
		name: 'Duplicate record',
		    fields: {
		            /** . */
		            'duplicateFields': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		            /** . */
		            'duplicateValues': {
		                type: 'text',
		                isRequired: true,
		                isArray: true,
		                options: undefined
		            },
		            /** . */
		            'collectionName': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** Action. e.g. create, update, etc. */
		            'action': {
		                label: 'Action',
		                type: 'text',
		                isRequired: true,
		                hint: 'e.g. create, update, etc.',
		                options: undefined
		            },
		    }
	}

	export type DuplicateRecordEntity = SchemaEntity<SpruceErrors.DataStores.DuplicateRecordSchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface DuplicateKey {
		
	}

	export interface DuplicateKeySchema extends SpruceSchema.Schema {
		id: 'duplicateKey',
		namespace: 'DataStores',
		name: 'Duplicate Key',
		    fields: {
		    }
	}

	export type DuplicateKeyEntity = SchemaEntity<SpruceErrors.DataStores.DuplicateKeySchema>

}


export declare namespace SpruceErrors.DataStores {

	
	export interface DatabaseNotConnected {
		
			
			'operationAttempted': string
			
			'collectionName'?: string | undefined | null
	}

	export interface DatabaseNotConnectedSchema extends SpruceSchema.Schema {
		id: 'databaseNotConnected',
		namespace: 'DataStores',
		name: 'Database not connected',
		    fields: {
		            /** . */
		            'operationAttempted': {
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		            /** . */
		            'collectionName': {
		                type: 'text',
		                options: undefined
		            },
		    }
	}

	export type DatabaseNotConnectedEntity = SchemaEntity<SpruceErrors.DataStores.DatabaseNotConnectedSchema>

}




