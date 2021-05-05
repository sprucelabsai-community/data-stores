import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture from '../../fixtures/DatabaseFixture'

export default class TestingWithDatabasesTest extends AbstractSpruceTest {
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

	@test()
	protected static async beforeAllSetsConnectionDetails() {
		delete process.env.DB_CONNECTION_STRING
		delete process.env.DB_NAME

		DatabaseFixture.beforeAll()

		assert.isEqual(process.env.DB_CONNECTION_STRING, 'memory://')
		assert.isEqual(process.env.DB_NAME, 'skill')
	}
}
