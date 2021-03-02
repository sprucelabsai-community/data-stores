import { SpruceErrors } from "#spruce/errors/errors.types"
import { SpruceErrorOptions, ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"
import { SchemaErrorOptions } from '@sprucelabs/schema'

export interface DuplicateRecordErrorOptions extends SpruceErrors.DataStores.DuplicateRecord, ISpruceErrorOptions {
	code: 'DUPLICATE_RECORD'
}
export interface UnknownStoreErrorErrorOptions extends SpruceErrors.DataStores.UnknownStoreError, ISpruceErrorOptions {
	code: 'UNKNOWN_STORE_ERROR'
}
export interface RecordNotFoundErrorOptions extends SpruceErrors.DataStores.RecordNotFound, ISpruceErrorOptions {
	code: 'RECORD_NOT_FOUND'
}
export interface DatabaseNotConnectedErrorOptions extends SpruceErrors.DataStores.DatabaseNotConnected, ISpruceErrorOptions {
	code: 'DATABASE_NOT_CONNECTED'
}
export interface MongoIdMappingErrorErrorOptions extends SpruceErrors.DataStores.MongoIdMappingError, ISpruceErrorOptions {
	code: 'MONGO_ID_MAPPING_ERROR'
}
export interface ScrambleNotConfiguredErrorOptions extends SpruceErrors.DataStores.ScrambleNotConfigured, ISpruceErrorOptions {
	code: 'SCRAMBLE_NOT_CONFIGURED'
}

type ErrorOptions = SchemaErrorOptions | SpruceErrorOptions | DuplicateRecordErrorOptions  | UnknownStoreErrorErrorOptions  | RecordNotFoundErrorOptions  | DatabaseNotConnectedErrorOptions  | MongoIdMappingErrorErrorOptions  | ScrambleNotConfiguredErrorOptions 

export default ErrorOptions
