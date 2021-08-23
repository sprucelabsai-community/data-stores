import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface UnknownStoreErrorErrorOptions extends SpruceErrors.DataStores.UnknownStoreError, ISpruceErrorOptions {
	code: 'UNKNOWN_STORE_ERROR'
}
export interface UnknownDatabaseErrorErrorOptions extends SpruceErrors.DataStores.UnknownDatabaseError, ISpruceErrorOptions {
	code: 'UNKNOWN_DATABASE_ERROR'
}
export interface UnableToConnectToDbErrorOptions extends SpruceErrors.DataStores.UnableToConnectToDb, ISpruceErrorOptions {
	code: 'UNABLE_TO_CONNECT_TO_DB'
}
export interface ScrambleNotConfiguredErrorOptions extends SpruceErrors.DataStores.ScrambleNotConfigured, ISpruceErrorOptions {
	code: 'SCRAMBLE_NOT_CONFIGURED'
}
export interface RecordNotFoundErrorOptions extends SpruceErrors.DataStores.RecordNotFound, ISpruceErrorOptions {
	code: 'RECORD_NOT_FOUND'
}
export interface MongoIdMappingErrorErrorOptions extends SpruceErrors.DataStores.MongoIdMappingError, ISpruceErrorOptions {
	code: 'MONGO_ID_MAPPING_ERROR'
}
export interface InvalidStoreNameErrorOptions extends SpruceErrors.DataStores.InvalidStoreName, ISpruceErrorOptions {
	code: 'INVALID_STORE_NAME'
}
export interface InvalidStoreErrorOptions extends SpruceErrors.DataStores.InvalidStore, ISpruceErrorOptions {
	code: 'INVALID_STORE'
}
export interface InvalidDbConnectionStringErrorOptions extends SpruceErrors.DataStores.InvalidDbConnectionString, ISpruceErrorOptions {
	code: 'INVALID_DB_CONNECTION_STRING'
}
export interface InvalidDatabaseNameErrorOptions extends SpruceErrors.DataStores.InvalidDatabaseName, ISpruceErrorOptions {
	code: 'INVALID_DATABASE_NAME'
}
export interface IndexNotFoundErrorOptions extends SpruceErrors.DataStores.IndexNotFound, ISpruceErrorOptions {
	code: 'INDEX_NOT_FOUND'
}
export interface IndexExistsErrorOptions extends SpruceErrors.DataStores.IndexExists, ISpruceErrorOptions {
	code: 'INDEX_EXISTS'
}
export interface FailedToLoadStoresErrorOptions extends SpruceErrors.DataStores.FailedToLoadStores, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_STORES'
}
export interface FailedToLoadStoreErrorOptions extends SpruceErrors.DataStores.FailedToLoadStore, ISpruceErrorOptions {
	code: 'FAILED_TO_LOAD_STORE'
}
export interface DuplicateRecordErrorOptions extends SpruceErrors.DataStores.DuplicateRecord, ISpruceErrorOptions {
	code: 'DUPLICATE_RECORD'
}
export interface DatabaseNotConnectedErrorOptions extends SpruceErrors.DataStores.DatabaseNotConnected, ISpruceErrorOptions {
	code: 'DATABASE_NOT_CONNECTED'
}

type ErrorOptions = SchemaErrorOptions | UnknownStoreErrorErrorOptions  | UnknownDatabaseErrorErrorOptions  | UnableToConnectToDbErrorOptions  | ScrambleNotConfiguredErrorOptions  | RecordNotFoundErrorOptions  | MongoIdMappingErrorErrorOptions  | InvalidStoreNameErrorOptions  | InvalidStoreErrorOptions  | InvalidDbConnectionStringErrorOptions  | InvalidDatabaseNameErrorOptions  | IndexNotFoundErrorOptions  | IndexExistsErrorOptions  | FailedToLoadStoresErrorOptions  | FailedToLoadStoreErrorOptions  | DuplicateRecordErrorOptions  | DatabaseNotConnectedErrorOptions 

export default ErrorOptions
