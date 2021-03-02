import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface RecordNotFoundErrorOptions extends SpruceErrors.DataStores.RecordNotFound, ISpruceErrorOptions {
	code: 'RECORD_NOT_FOUND'
}
export interface UnknownStoreErrorErrorOptions extends SpruceErrors.DataStores.UnknownStoreError, ISpruceErrorOptions {
	code: 'UNKNOWN_STORE_ERROR'
}
export interface ScrambleNotConfiguredErrorOptions extends SpruceErrors.DataStores.ScrambleNotConfigured, ISpruceErrorOptions {
	code: 'SCRAMBLE_NOT_CONFIGURED'
}
export interface InvalidStoreNameErrorOptions extends SpruceErrors.DataStores.InvalidStoreName, ISpruceErrorOptions {
	code: 'INVALID_STORE_NAME'
}
export interface DuplicateRecordErrorOptions extends SpruceErrors.DataStores.DuplicateRecord, ISpruceErrorOptions {
	code: 'DUPLICATE_RECORD'
}
export interface InvalidStoreErrorOptions extends SpruceErrors.DataStores.InvalidStore, ISpruceErrorOptions {
	code: 'INVALID_STORE'
}
export interface MongoIdMappingErrorErrorOptions extends SpruceErrors.DataStores.MongoIdMappingError, ISpruceErrorOptions {
	code: 'MONGO_ID_MAPPING_ERROR'
}
export interface DatabaseNotConnectedErrorOptions extends SpruceErrors.DataStores.DatabaseNotConnected, ISpruceErrorOptions {
	code: 'DATABASE_NOT_CONNECTED'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | RecordNotFoundErrorOptions  | UnknownStoreErrorErrorOptions  | ScrambleNotConfiguredErrorOptions  | InvalidStoreNameErrorOptions  | DuplicateRecordErrorOptions  | InvalidStoreErrorOptions  | MongoIdMappingErrorErrorOptions  | DatabaseNotConnectedErrorOptions 

export default ErrorOptions
