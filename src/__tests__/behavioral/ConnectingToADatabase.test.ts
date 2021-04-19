import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'

export default class ConnectingToADatabaseTest extends AbstractSpruceTest {
	@test()
	protected static async sameSettingsSharesIntsance() {
		const db1 = DatabaseFactory.Database({
			dbName: 'test',
			dbConnectionString: 'memory://',
		})
		const db2 = DatabaseFactory.Database({
			dbName: 'test',
			dbConnectionString: 'memory://',
		})

		assert.isEqual(db1, db2)
	}

	@test()
	protected static async twoInMemoryConnectionsShareInstances() {
		const db1 = DatabaseFactory.Database({
			dbName: 'test1',
			dbConnectionString: 'memory://',
		})
		const db2 = DatabaseFactory.Database({
			dbName: 'test2',
			dbConnectionString: 'memory://',
		})

		assert.isNotEqual(db1, db2)
	}

	@test()
	protected static async databaseFixtureUsesProcessEnvAndReturnsDifferenceInstance() {
		const db1 = DatabaseFactory.Database({
			dbName: 'skill',
			dbConnectionString: 'memory://',
		})

		process.env.DB_CONNECTION_STRING = 'memory://'
		process.env.DB_NAME = 'skill2'

		const fixture = new DatabaseFixture()
		const db2 = await fixture.connectToDatabase()

		assert.isNotEqual(db1, db2)
	}

	@test()
	protected static async databaseFixtureUsesProcessEnv() {
		const db1 = DatabaseFactory.Database({
			dbName: 'skill',
			dbConnectionString: 'memory://',
		})

		process.env.DB_CONNECTION_STRING = 'memory://'
		process.env.DB_NAME = 'skill'

		const fixture = new DatabaseFixture()
		const db2 = await fixture.connectToDatabase()

		assert.isEqual(db1, db2)
	}
}
