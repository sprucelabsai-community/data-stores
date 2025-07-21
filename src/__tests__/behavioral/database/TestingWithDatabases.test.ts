import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import DatabaseFactory from '../../../factories/DatabaseFactory'
import DatabaseFixture, {
    DatabaseFixtureOptions,
} from '../../../fixtures/DatabaseFixture'

@suite()
export default class TestingWithDatabasesTest extends AbstractSpruceTest {
    @test(
        'throws unexpected with in memory and just passing dbString',
        {
            dbConnectionString: false,
        },
        'MISSING_PARAMETERS',
        ['dbConnectionString']
    )
    protected async cantPassDbValuesIfUsingInMemoryDatabase(
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

        errorAssert.assertError(err, code, {
            parameters: params,
        })
    }

    @test()
    protected async databaseFixtureUsesConstructorParamsAndReturnsDifferenceInstance() {
        const db1 = DatabaseFactory.Database({
            dbName: 'skill',
            dbConnectionString: 'memory://',
        })

        const fixture = new DatabaseFixture({
            dbConnectionString: 'memory://',
            dbName: 'skill2',
        })

        const db2 = await fixture.connectToDatabase()

        assert.isNotEqual(db1, db2)
        assert.isEqual(fixture.getDbName(), 'skill2')
    }

    @test()
    protected async databaseFixtureReusesDatabaseInstanceWithSameConnectionDetails() {
        const db1 = DatabaseFactory.Database({
            dbName: 'skill',
            dbConnectionString: 'memory://',
        })

        const fixture = new DatabaseFixture({
            dbConnectionString: 'memory://',
            dbName: 'skill',
        })

        const db2 = await fixture.connectToDatabase()

        assert.isEqual(db1, db2)
    }
}
