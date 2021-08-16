import { MONGO_TEST_URI } from '../databases/MongoDatabase'
import DatabaseFactory from '../factories/DatabaseFactory'
import StoreLoader from '../loaders/StoreLoader'
import { Database } from '../types/database.types'

export interface DatabaseFixtureOptions {
	shouldUseInMemoryDatabase?: boolean
}

export default class DatabaseFixture {
	private shouldUseInMemoryDatabase: boolean
	private static dbCount = 0
	private dbName?: string
	private static activeDatabases: Database[] = []

	public constructor(options?: DatabaseFixtureOptions) {
		this.shouldUseInMemoryDatabase = options?.shouldUseInMemoryDatabase ?? true
	}

	public async connectToDatabase(): Promise<Database> {
		const options: any = {}
		if (process.env.DB_CONNECTION_STRING && process.env.DB_NAME) {
			options.dbConnectionString = process.env.DB_CONNECTION_STRING
			options.dbName = process.env.DB_NAME
		} else if (this.shouldUseInMemoryDatabase) {
			options.dbConnectionString = 'memory://'
		} else {
			options.dbName = this.dbName = DatabaseFixture.generateDbName()
			options.dbConnectionString = MONGO_TEST_URI
		}

		const database = DatabaseFactory.Database(options)

		await database.connect()

		DatabaseFixture.activeDatabases.push(database)

		return database
	}

	public static generateDbName(): string {
		return `mercury_${new Date().getTime()}-${this.dbCount++}`
	}

	public getDbName() {
		if (!this.dbName) {
			throw new Error(
				'You need to connect to the database using `shouldUseInMemoryDatabase=false` before accessing dbName.'
			)
		}
		return this.dbName
	}

	public static async destroy() {
		for (const db of this.activeDatabases) {
			await db.dropDatabase()
			await db.close()
		}

		this.activeDatabases = []

		DatabaseFactory.reset()
		StoreLoader.clearInstance()
	}

	public static beforeAll() {
		process.env.DB_CONNECTION_STRING = 'memory://'
		process.env.DB_NAME = 'skill'
	}
}
