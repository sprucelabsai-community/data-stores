import { SchemaError } from '@sprucelabs/schema'
import MongoDatabase from '../databases/MongoDatabase'
import NeDbDatabase from '../databases/NeDbDatabase'
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
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: ['dbConnectionString'],
				friendlyMessage:
					"DatabaseFactory can't connect to the database! Setting env.DB_CONNECTION_STRING may help!",
			})
		}

		const cacheKey = this.generateCacheKey(options)

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

	private static generateCacheKey(options: {
		dbName: string
		dbConnectionString: string
	}) {
		if (!options.dbName && options.dbConnectionString.includes('memory')) {
			options.dbName = 'memory'
		}
		return options.dbName + options.dbConnectionString
	}

	public static reset() {
		this.cache = {}
	}
}
