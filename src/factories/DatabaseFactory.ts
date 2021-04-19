import MongoDatabase from '../databases/MongoDatabase'
import NeDbDatabase from '../databases/NeDbDatabase'
import SpruceError from '../errors/SpruceError'
import { Database } from '../types/database.types'

export default class DatabaseFactory {
	private static cache: Record<string, any> = {}

	private constructor() {}

	public static Database(options: {
		dbName: string
		dbConnectionString: string
	}): Database {
		const { dbName, dbConnectionString } = options
		let database

		if (!dbConnectionString) {
			throw new SpruceError({
				code: 'MISSING_PARAMETERS',
				parameters: ['dbConnectionString'],
				friendlyMessage: "DatabaseFactory can't connect to the database!",
			})
		}

		const cacheKey = options.dbName + options.dbConnectionString

		if (!this.cache[cacheKey]) {
			if (dbConnectionString.startsWith('memory')) {
				database = new NeDbDatabase()
			} else {
				database = new MongoDatabase(dbConnectionString, { dbName })
			}

			this.cache[cacheKey] = database
		}

		return this.cache[cacheKey]
	}
}
