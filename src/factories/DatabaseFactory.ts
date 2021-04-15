import MongoDatabase from '../databases/MongoDatabase'
import NeDbDatabase from '../databases/NeDbDatabase'
import SpruceError from '../errors/SpruceError'

export default class DatabaseFactory {
	private constructor() {}

	public static Database(options: {
		dbName: string
		dbConnectionString: string
	}) {
		const { dbName, dbConnectionString } = options
		let database

		if (!dbConnectionString) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['dbConnectionString'],
				friendlyMessage: "DatabaseFactory can't connect to the database!",
			})
		}

		if (dbConnectionString.startsWith('memory')) {
			database = new NeDbDatabase()
		} else {
			database = new MongoDatabase(dbConnectionString, { dbName })
		}

		return database
	}
}
