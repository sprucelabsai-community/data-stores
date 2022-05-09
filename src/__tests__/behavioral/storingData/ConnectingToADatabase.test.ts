import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import DatabaseFactory from '../../../factories/DatabaseFactory'

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
}
