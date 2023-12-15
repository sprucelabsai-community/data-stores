import { SchemaError } from '@sprucelabs/schema'
import { MONGO_TEST_URI } from '../databases/MongoDatabase'
import NeDbDatabase, { FakeQueryHandler } from '../databases/NeDbDatabase'
import SpruceError from '../errors/SpruceError'
import DatabaseFactory from '../factories/DatabaseFactory'
import { Database } from '../types/database.types'

export interface DatabaseFixtureOptions {
	dbConnectionString?: string
	dbName?: string
}

const MEMORY = 'memory://'
export default class DatabaseFixture {
	private static dbCount = 0
	private dbName?: string
	private static activeDatabases: Database[] = []
	private dbConnectionString?: string
	private static defaultOptions?: DatabaseFixtureOptions

	public constructor(options?: DatabaseFixtureOptions) {
		const { dbConnectionString = MEMORY, dbName = 'memory' } = {
			...DatabaseFixture.defaultOptions,
			...options,
		}
		const missing: string[] = []

		if (!dbConnectionString) {
			missing.push('dbConnectionString')
		}

		if (missing.length > 0) {
			throw new SchemaError({
				code: 'MISSING_PARAMETERS',
				parameters: missing,
			})
		}

		this.dbName = dbName
		this.dbConnectionString = dbConnectionString
	}

	public async connectToDatabase(): Promise<Database> {
		const options: any = {}
		if (this.dbConnectionString && this.dbName) {
			options.dbConnectionString = this.dbConnectionString
			options.dbName = this.dbName
		} else if (this.dbConnectionString) {
			options.dbConnectionString = this.dbConnectionString
		} else {
			options.dbName = this.dbName = DatabaseFixture.generateDbName()
			options.dbConnectionString = MONGO_TEST_URI
		}

		const database = await DatabaseFixture.connect(options)

		return database
	}

	private static async connect(options: any) {
		const database = DatabaseFactory.Database(options)
		await database.connect()

		DatabaseFixture.activeDatabases.push(database)
		return database
	}

	public fakeQuery<T>(query: string, cb: FakeQueryHandler<T>) {
		const db = DatabaseFixture.activeDatabases[0] as NeDbDatabase | undefined

		if (!db) {
			throw new SpruceError({
				code: 'DATABASE_NOT_CONNECTED',
				operationAttempted: 'fakeQuery',
				friendlyMessage:
					"You can't fake a query until you connect to a database.",
			})
		}

		db.fakeQuery(query, cb)
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
		if (this.defaultOptions && this.activeDatabases.length === 0) {
			await DatabaseFixture.connect(this.defaultOptions)
		}

		for (const db of this.activeDatabases) {
			if (db.isConnected()) {
				await db.dropDatabase()
				await db.close()
			}
		}

		this.activeDatabases = []

		DatabaseFactory.reset()
	}

	public static beforeAll() {}

	public static async beforeEach() {
		await this.destroy()
	}

	public static async afterEach() {
		await this.destroy()
	}
}
