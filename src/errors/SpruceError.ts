import AbstractSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
	public friendlyMessage(): string {
		const { options } = this
		let message

		switch (options?.code) {
			case 'DATABASE_NOT_CONNECTED':
				message = `Oh no! I could not ${options.operationAttempted}${
					options.collectionName
						? ` I tried this on the '${options.collectionName}' collection.`
						: ''
				}`
				break

			case 'DUPLICATE_RECORD': {
				const fields = options.duplicateFields.filter((f) => f !== 'id')
				return `One or more ${
					options.collectionName
				} already have the ${fields.join(' and ')} you provided.`
			}

			case 'UNKNOWN_STORE_ERROR':
				message = `An unknown error occurred in the ${options.storeName} store. The original error is: \n\n${options.originalError?.stack}`
				break

			case 'RECORD_NOT_FOUND':
				message = `I looked through all ${options.storeName} and couldn't find what you're looking for.`
				break

			case 'MONGO_ID_MAPPING_ERROR':
				message = `A query was run where the id was not a string: \n\n${options.friendlyMessage}`
				break

			case 'SCRAMBLE_NOT_CONFIGURED':
				message = 'A Scramble not configured just happened!'
				break

			case 'INVALID_STORE':
				message =
					options.friendlyMessage ??
					`The store you passed does not extend AbstractStore!`
				break

			case 'INVALID_STORE_NAME':
				message = `I couldn't find a store named '${options.suppliedName}'. `
				if (options.validNames.length === 0) {
					message += 'There are actually no stores available.'
				} else {
					message += `Valid names are:\n\n`
					message += options.validNames.join('\n')
				}
				break

			case 'FAILED_TO_LOAD_STORE':
				message = `Dang it, I couldn't load your ${options.name} store!`
				if (options.originalError) {
					message += '\n\nOriginal error:\n\n' + options.originalError.message
				}
				break

			case 'INVALID_DB_CONNECTION_STRING':
				message = 'The database connection string you sent is no good!'
				break

			case 'UNKNOWN_DATABASE_ERROR':
				message = `Something went wrong with the database, the message is:\n\n"${options.databaseErrorMessage}"`
				break

			case 'UNABLE_TO_CONNECT_TO_DB':
				message = 'A Unable to connect to db just happened!'
				break

			case 'FAILED_TO_LOAD_STORES': {
				const totalErrors = options.errors.length
				message = `Shoot! I couldn't load your data stores. Found ${totalErrors} error${
					totalErrors === 1 ? '' : 's'
				}:\n\n`

				for (const err of options.errors) {
					message += `${err.message}\n`
				}

				break
			}

			case 'MISSING_PARAMETERS':
				message = `${
					options.friendlyMessage ? options.friendlyMessage + ' ' : ''
				}You are missing the following parameter${
					options.parameters.length === 1 ? '' : 's'
				}:\n\n${options.parameters.join('\n')}`
				break

			case 'INVALID_DATABASE_NAME':
				message = `Halt! '${options.suppliedName}' is not a valid name for a database!`
				break

			case 'INDEX_NOT_FOUND':
				message = `The unique index ${options.missingIndex.join(
					', '
				)} you tried to remove does not exist!`
				break

			case 'INDEX_EXISTS':
				message = `The unique index ${options.index.join(
					', '
				)} you attempted to create already exists!`
				break

			default:
				message = super.friendlyMessage()
		}

		const fullMessage = message ?? options.friendlyMessage

		return fullMessage
	}
}
