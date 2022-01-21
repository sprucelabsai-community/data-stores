import { test, assert } from '@sprucelabs/test'
import { MongoClient } from 'mongodb'
import { MongoDatabase, NeDbDatabase } from '../..'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'

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

	@test('connects and resets with beforeEach', 'beforeEach')
	@test('connects and resets with afterEach', 'afterEach')
	protected static async usesDefaultConnectOptions(
		method: 'beforeEach' | 'afterEach'
	) {
		DatabaseFixture.setDefaultConnectOptions({
			shouldUseInMemoryDatabase: false,
			dbConnectionString: process.env.TEST_DB_CONNECTION_STRING,
			dbName: DatabaseFixture.generateDbName(),
		})

		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		assert.isTrue(db instanceof MongoDatabase)

		await DatabaseFixture[method]()

		const fixture2 = new DatabaseFixture()

		const db2 = await fixture2.connectToDatabase()
		assert.isTrue(db2 instanceof NeDbDatabase)
	}

	@test()
	protected static async cleansUpDatabaseWithDefaultConnectOptionsEvenWhenNeverConnected() {
		const dbName = DatabaseFixture.generateDbName()
		const connectionString =
			process.env.TEST_DB_CONNECTION_STRING ?? '**missing**'

		DatabaseFixture.setDefaultConnectOptions({
			shouldUseInMemoryDatabase: false,
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
}
