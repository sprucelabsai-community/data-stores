/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable no-redeclare */

import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





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

	
	export interface RecordNotFoundQuery {
			/** . */
			[field:string]: (any)| undefined | null
	}

	export interface RecordNotFoundQuerySchema extends SpruceSchema.Schema {
		id: 'record-not-found-query',
		namespace: 'DataStores',
		name: 'Search query',
		dynamicFieldSignature: { 
		    type: 'raw',
		    keyName: 'field',
		    options: {valueType: `any`,}
		}	}

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

	
	export interface DatabaseNotConnected {
		
			/** Operation Attempted. */
			'operationAttempted': string
	}

	export interface DatabaseNotConnectedSchema extends SpruceSchema.Schema {
		id: 'databaseNotConnected',
		namespace: 'DataStores',
		name: 'Database not connected',
		    fields: {
		            /** Operation Attempted. */
		            'operationAttempted': {
		                label: 'Operation Attempted',
		                type: 'text',
		                isRequired: true,
		                options: undefined
		            },
		    }
	}

	export type DatabaseNotConnectedEntity = SchemaEntity<SpruceErrors.DataStores.DatabaseNotConnectedSchema>

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




