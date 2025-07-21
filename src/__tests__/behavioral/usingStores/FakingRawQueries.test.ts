import {
    test,
    suite,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import NeDbDatabase, { FakeQueryHandler } from '../../../databases/NeDbDatabase'
import AbstractStoreTest from './support/AbstractStoreTest'

@suite()
export default class FakingRawQueriesTest extends AbstractStoreTest {
    protected db!: NeDbDatabase

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        await this.connectToDatabase()
    }

    @test()
    protected async throwsWhenQueryNotFaked() {
        const query = generateId()
        await this.assertThrowsQueryNotFaked(query)
    }

    @test('throws if does not return array 1', { hello: 'world' })
    @test('throws if does not return array 2', { goodbye: 'taco' })
    protected async throwsIfFakeDoesNotReturnArray(
        response: Record<string, any>
    ) {
        const query = generateId()

        this.fakeQuery(query, () => response as any)

        const err = await assert.doesThrowAsync(() => this.query(query))
        errorAssert.assertError(err, 'INVALID_FAKE_QUERY_RESPONSE', {
            query,
            response,
        })
    }

    @test('can fake query 1', [{ hello: 'world' }])
    @test('can fake query 2', [{ goodbye: 'taco' }])
    protected async canFakeQuery(expected: Record<string, any>[]) {
        const query = generateId()

        const cb = async () => {
            return expected
        }

        this.fakeQuery(query, cb)

        const results = await this.query(query)

        assert.isEqualDeep(results, expected)

        await this.assertThrowsQueryNotFaked(generateId())
    }

    @test()
    protected async canFakeMoreThanOneQueryAtATime() {
        this.fakeQuery('select * from people', () => [])
        this.fakeQuery('select * from cars', () => [])

        await this.query('select * from people')
        await this.query('select * from cars')
    }

    @test('passes through params 1', ['hello'])
    @test('passes through params 2', ['world'])
    protected async passesThroughParams(expected: any[]) {
        const query = generateId()

        this.fakeQuery(query, (params) => {
            assert.isEqualDeep(params, expected)
            return []
        })

        await this.query(query, expected)
    }

    @test()
    protected async inMemoryDatabaseNameDefaultsToMemoryDatabaseName() {
        const { dbFixture } = await this.DatabaseConnection()
        assert.isEqual(dbFixture.getDbName(), 'memory')
    }

    @test(
        'faking does not consider case',
        'select * from people',
        'SELECT * FROM people'
    )
    @test(
        'faking does not consider whitespace',
        'select * from people',
        'select*from people'
    )
    @test(
        'faking does not consider newlines',
        'select * from people',
        'select\n*\nfrom\npeople'
    )
    @test(
        'faking does not consider tabs',
        'select * from people',
        'select\t*\tfrom\tpeople'
    )
    protected async fakingDoesNotConsiderCaseNorNewlines(
        faked: string,
        query: string
    ) {
        this.fakeQuery(faked, () => [])
        await this.query(query)
    }

    private fakeQuery<T>(query: string, cb: FakeQueryHandler<T>) {
        this.db.fakeQuery(query, cb)
    }

    private async assertThrowsQueryNotFaked(query: string) {
        const err = await assert.doesThrowAsync(() => this.query(query))
        errorAssert.assertError(err, 'QUERY_NOT_FAKED', { query })
    }

    private query(query: string, params?: any[]) {
        return this.db.query(query, params)
    }
}
