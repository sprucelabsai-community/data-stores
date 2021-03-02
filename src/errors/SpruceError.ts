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

			default:
				message = super.friendlyMessage()
		}

		const fullMessage = options.friendlyMessage
			? options.friendlyMessage
			: message

		return fullMessage
	}
}
