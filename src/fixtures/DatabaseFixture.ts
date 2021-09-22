import { SchemaError } from '@sprucelabs/schema'
import { MONGO_TEST_URI } from '../databases/MongoDatabase'
import DatabaseFactory from '../factories/DatabaseFactory'
import { Database } from '../types/database.types'

export interface DatabaseFixtureOptions {
	shouldUseInMemoryDatabase?: boolean
	dbConnectionString?: string
	dbName?: string
}

export default class DatabaseFixture {
	private shouldUseInMemoryDatabase: boolean
	private static dbCount = 0
	private dbName?: string
	private static activeDatabases: Database[] = []
	private dbConnectionString?: string
	private static defaultOptions?: DatabaseFixtureOptions

	public constructor(options?: DatabaseFixtureOptions) {
		const mixed = { ...DatabaseFixture.defaultOptions, ...options }

		this.shouldUseInMemoryDatabase = mixed?.shouldUseInMemoryDatabase ?? true

		if (this.shouldUseInMemoryDatabase) {
			const unexpected: string[] = []

			if (mixed?.dbName) {
				unexpected.push('dbName')
			}

			if (mixed?.dbConnectionString) {
				unexpected.push('dbConnectionString')
			}

			if (unexpected.length > 0) {
				throw new SchemaError({
					code: 'UNEXPECTED_PARAMETERS',
					parameters: unexpected,
				})
			}
		} else {
			const missing: string[] = []

			if (!mixed?.dbName) {
				missing.push('dbName')
			}

			if (!mixed?.dbConnectionString) {
				missing.push('dbConnectionString')
			}

			if (missing.length > 0) {
				throw new SchemaError({
					code: 'MISSING_PARAMETERS',
					parameters: missing,
				})
			}

			this.dbName = mixed?.dbName
			this.dbConnectionString = mixed?.dbConnectionString
		}
	}

	public async connectToDatabase(): Promise<Database> {
		const options: any = {}
		if (this.shouldUseInMemoryDatabase) {
			options.dbConnectionString = 'memory://'
		} else if (this.dbConnectionString && this.dbName) {
			options.dbConnectionString = this.dbConnectionString
			options.dbName = this.dbName
		} else {
			options.dbName = this.dbName = DatabaseFixture.generateDbName()
			options.dbConnectionString = MONGO_TEST_URI
		}

		const database = DatabaseFactory.Database(options)

		await database.connect()

		DatabaseFixture.activeDatabases.push(database)

		return database
	}

	public static setDefaultConnectOptions(options: DatabaseFixtureOptions) {
		this.defaultOptions = options
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
	}

	public static beforeAll() {}

	public static async beforeEach() {
		this.defaultOptions = undefined
	}
}
