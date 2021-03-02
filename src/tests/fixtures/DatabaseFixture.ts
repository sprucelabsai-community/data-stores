import MongoDatabase, { MONGO_TEST_URI } from '../../databases/MongoDatabase'
import NeDbDatabase from '../../databases/NeDbDatabase'
import { Database } from '../../types/database.types'

export interface DatabaseFixtureOptions {
	useInMemoryDatabase?: boolean
}

export default class DatabaseFixture {
	private useInMemoryDatabase: boolean
	private static dbCount = 0
	private dbName?: string
	private static activeDatabases: Database[] = []

	public constructor(options?: DatabaseFixtureOptions) {
		this.useInMemoryDatabase = options?.useInMemoryDatabase ?? true
	}

	public async connectToDatabase() {
		let database

		if (this.useInMemoryDatabase) {
			database = new NeDbDatabase()
		} else {
			this.dbName = DatabaseFixture.generateDbName()
			database = new MongoDatabase(MONGO_TEST_URI, { dbName: this.dbName })
		}

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
				'You need to connect to the database using `useInMemoryDatabase=false` before accessing dbName.'
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
	}
}
