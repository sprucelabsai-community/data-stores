import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface UnknownStoreErrorErrorOptions extends SpruceErrors.DataStores.UnknownStoreError, ISpruceErrorOptions {
	code: 'UNKNOWN_STORE_ERROR'
}
export interface UnknownErrorErrorOptions extends SpruceErrors.DataStores.UnknownError, ISpruceErrorOptions {
	code: 'UNKNOWN_ERROR'
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
export interface QueryNotFakedErrorOptions extends SpruceErrors.DataStores.QueryNotFaked, ISpruceErrorOptions {
	code: 'QUERY_NOT_FAKED'
}
export interface NotImplementedErrorOptions extends SpruceErrors.DataStores.NotImplemented, ISpruceErrorOptions {
	code: 'NOT_IMPLEMENTED'
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
export interface InvalidConnectionStringSchemeErrorOptions extends SpruceErrors.DataStores.InvalidConnectionStringScheme, ISpruceErrorOptions {
	code: 'INVALID_CONNECTION_STRING_SCHEME'
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
export interface DuplicateKeyErrorOptions extends SpruceErrors.DataStores.DuplicateKey, ISpruceErrorOptions {
	code: 'DUPLICATE_KEY'
}
export interface DatabaseNotConnectedErrorOptions extends SpruceErrors.DataStores.DatabaseNotConnected, ISpruceErrorOptions {
	code: 'DATABASE_NOT_CONNECTED'
}

type ErrorOptions =  | UnknownStoreErrorErrorOptions  | UnknownErrorErrorOptions  | UnknownDatabaseErrorErrorOptions  | UnableToConnectToDbErrorOptions  | ScrambleNotConfiguredErrorOptions  | RecordNotFoundErrorOptions  | QueryNotFakedErrorOptions  | NotImplementedErrorOptions  | MongoIdMappingErrorErrorOptions  | InvalidStoreNameErrorOptions  | InvalidStoreErrorOptions  | InvalidDbConnectionStringErrorOptions  | InvalidDatabaseNameErrorOptions  | InvalidConnectionStringSchemeErrorOptions  | IndexNotFoundErrorOptions  | IndexExistsErrorOptions  | FailedToLoadStoresErrorOptions  | FailedToLoadStoreErrorOptions  | DuplicateRecordErrorOptions  | DuplicateKeyErrorOptions  | DatabaseNotConnectedErrorOptions 

export default ErrorOptions
