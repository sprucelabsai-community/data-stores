import { test, assert } from '@sprucelabs/test'
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

	@test()
	protected static async usesDefaultConnectOptions() {
		DatabaseFixture.setDefaultConnectOptions({
			shouldUseInMemoryDatabase: false,
			dbConnectionString: process.env.TEST_DB_CONNECTION_STRING,
			dbName: DatabaseFixture.generateDbName(),
		})

		const fixture = new DatabaseFixture()
		const db = await fixture.connectToDatabase()

		assert.isTrue(db instanceof MongoDatabase)

		await DatabaseFixture.beforeEach()

		const fixture2 = new DatabaseFixture()

		const db2 = await fixture2.connectToDatabase()
		assert.isTrue(db2 instanceof NeDbDatabase)
	}
}
