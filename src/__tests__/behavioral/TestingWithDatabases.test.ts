import AbstractSpruceTest, { test, assert } from '@sprucelabs/test'
import { errorAssertUtil } from '@sprucelabs/test-utils'
import DatabaseFactory from '../../factories/DatabaseFactory'
import DatabaseFixture, {
	DatabaseFixtureOptions,
} from '../../fixtures/DatabaseFixture'

export default class TestingWithDatabasesTest extends AbstractSpruceTest {
	@test(
		'throws unexpected with in memory and just passing dbString',
		{
			dbConnectionString: 'waka',
		},
		'MISSING_PARAMETERS',
		['dbName']
	)
	@test(
		'throws unexpected with in memory and just passing dbName',
		{
			dbName: 'waka',
		},
		'UNEXPECTED_PARAMETERS',
		['dbName']
	)
	@test(
		'throws unexpected with in memory and both passing dbString and ',
		{
			shouldUseInMemoryDatabase: true,
			dbName: 'waka',
			dbConnectionString: 'taco',
		},
		'UNEXPECTED_PARAMETERS',
		['dbName', 'dbConnectionString']
	)
	@test(
		'throws missing when not in memory and missing dbString and dbConnectionString',
		{
			shouldUseInMemoryDatabase: false,
		},
		'MISSING_PARAMETERS',
		['dbName', 'dbConnectionString']
	)
	@test(
		'throws missing when not in memory and missing dbString and dbConnectionString',
		{
			shouldUseInMemoryDatabase: false,
			dbName: 'taco',
		},
		'MISSING_PARAMETERS',
		['dbConnectionString']
	)
	protected static async cantPassDbValuesIfUsingInMemoryDatabase(
		options: DatabaseFixtureOptions,
		code: string,
		params: string[]
	) {
		const err = assert.doesThrow(
			() =>
				new DatabaseFixture({
					...options,
				})
		)

		errorAssertUtil.assertError(err, code, {
			parameters: params,
		})
	}

	@test()
	protected static async databaseFixtureUsesConstructorParamsAndReturnsDifferenceInstance() {
		const db1 = DatabaseFactory.Database({
			dbName: 'skill',
			dbConnectionString: 'memory://',
		})

		const fixture = new DatabaseFixture({
			shouldUseInMemoryDatabase: false,
			dbConnectionString: 'memory://',
			dbName: 'skill2',
		})

		const db2 = await fixture.connectToDatabase()

		assert.isNotEqual(db1, db2)
		assert.isEqual(fixture.getDbName(), 'skill2')
	}

	@test()
	protected static async databaseFixtureReusesDatabaseInstanceWithSameConnectionDetails() {
		const db1 = DatabaseFactory.Database({
			dbName: 'skill',
			dbConnectionString: 'memory://',
		})

		const fixture = new DatabaseFixture({
			shouldUseInMemoryDatabase: false,
			dbConnectionString: 'memory://',
			dbName: 'skill',
		})

		const db2 = await fixture.connectToDatabase()

		assert.isEqual(db1, db2)
	}
}
