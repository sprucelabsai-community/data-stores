import { test, assert, generateId, errorAssert } from '@sprucelabs/test-utils'
import { MongoClient } from 'mongodb'
import MongoDatabase from '../../../databases/MongoDatabase'
import NeDbDatabase, { FakeQueryHandler } from '../../../databases/NeDbDatabase'
import DatabaseFactory from '../../../factories/DatabaseFactory'
import DatabaseFixture from '../../../fixtures/DatabaseFixture'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'

require('dotenv').config()

export default class DatabaseFixtureTest extends AbstractDatabaseTest {
	@test()
	protected static async fixtureClearsDatabaseCacheOnDestroy() {
		const databaseFixture = new DatabaseFixture()

		await databaseFixture.connectToDatabase()
		await DatabaseFixture.destroy()

		//@ts-ignore
		assert.isLength(Object.keys(DatabaseFactory.cache), 0)
	}

	@test()
	protected static hasSetDefaultConnectOptions() {
		assert.isFunction(DatabaseFixture.setDefaultConnectOptions)
	}

	@test('connects and remembers default settings with beforeEach', 'beforeEach')
	@test('connects and remembers default settings with afterEach', 'afterEach')
	protected static async usesDefaultConnectOptions(
		method: 'beforeEach' | 'afterEach'
	) {
		DatabaseFixture.setDefaultConnectOptions({
			dbConnectionString: process.env.TEST_DB_CONNECTION_STRING,
			dbName: DatabaseFixture.generateDbName(),
		})

		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		assert.isTrue(db instanceof MongoDatabase)

		await DatabaseFixture[method]()

		const fixture2 = new DatabaseFixture()

		const db2 = await fixture2.connectToDatabase()
		assert.isTrue(db2 instanceof MongoDatabase)
	}

	@test()
	protected static async cleansUpDatabaseWithDefaultConnectOptionsEvenWhenNeverConnected() {
		const dbName = DatabaseFixture.generateDbName()
		const connectionString =
			process.env.TEST_DB_CONNECTION_STRING ?? '**missing**'

		DatabaseFixture.setDefaultConnectOptions({
			dbConnectionString: connectionString,
			dbName,
		})

		const mongo = new MongoClient(connectionString)
		await mongo.connect()

		const db = mongo.db(dbName)
		await db.collection(dbName).insertOne({ go: 'team' })

		await DatabaseFixture.beforeEach()

		//@ts-ignore
		const { databases } = await db.admin().listDatabases()

		const match = databases.find((db: any) => db.name === dbName)

		assert.isFalsy(match)
	}

	@test()
	protected static async passingConnectionStringThatStartsWithoutMemory() {
		new DatabaseFixture({
			dbConnectionString: process.env.TEST_DB_CONNECTION_STRING,
			dbName: 'testing',
		})
	}

	@test()
	protected static async cantFakeUntilConnectedToDatabase() {
		const fixture = new DatabaseFixture()
		const err = assert.doesThrow(() =>
			fixture.fakeQuery(generateId(), () => [])
		)
		errorAssert.assertError(err, 'DATABASE_NOT_CONNECTED', {
			operationAttempted: 'fakeQuery',
		})
	}

	protected static async canFakeAfterConnect() {
		const fixture = new DatabaseFixture({
			dbConnectionString: 'memory://',
		})
		const db = (await fixture.connectToDatabase()) as NeDbDatabase

		let passedQuery: string | undefined
		let passedCb: FakeQueryHandler<any> | undefined

		db.fakeQuery = (query, cb) => {
			passedQuery = query
			passedCb = cb
		}

		const query = generateId()

		const cb = () => []

		fixture.fakeQuery(generateId(), cb)

		assert.isEqual(passedQuery, query)
		assert.isEqual(passedCb, cb)
	}
}
