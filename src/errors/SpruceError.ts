import AbstractSpruceError from '@sprucelabs/error'
import ErrorOptions from '#spruce/errors/options.types'

export default class SpruceError extends AbstractSpruceError<ErrorOptions> {
	public friendlyMessage(): string {
		const { options } = this
		let message

		switch (options?.code) {
			case 'DATABASE_NOT_CONNECTED':
				message = 'A Database not connected just happened!'
				break

			case 'DUPLICATE_RECORD':
				message = 'A Duplicate record just happened!'
				break

			case 'UNKNOWN_STORE_ERROR':
				message = 'A Unknown store error just happened!'
				break

			case 'RECORD_NOT_FOUND':
				message = 'A Record not found just happened!'
				break

			case 'MONGO_ID_MAPPING_ERROR':
				message = 'A Mongo id mapping error just happened!'
				break

			case 'SCRAMBLE_NOT_CONFIGURED':
				message = 'A Scramble not configured just happened!'
				break

			case 'INVALID_STORE':
				message = `The store you passed does not extend AbstractStore!`
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
				message = 'A Invalid db connection string just happened!'
				break

			case 'UNKNOWN_DATABASE_ERROR':
				message = 'A unknown database error just happened!'
				break

			case 'UNABLE_TO_CONNECT_TO_DB':
				message = 'A Unable to connect to db just happened!'
				break

			default:
				message = super.friendlyMessage()
		}

		const fullMessage = options.friendlyMessage
			? options.friendlyMessage
			: message

		return fullMessage
	}
}
