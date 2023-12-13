import { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import NeDbDatabase, { FakeQueryHandler } from '../../../databases/NeDbDatabase'
import AbstractStoreTest from './support/AbstractStoreTest'

export default class FakingRawQueriesTest extends AbstractStoreTest {
	protected static db: NeDbDatabase

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		await this.connectToDatabase()
	}

	@test()
	protected static async throwsWhenQueryNotFaked() {
		const query = generateId()
		await this.assertThrowsQueryNotFaked(query)
	}

	@test('can fake query 1', { hello: 'world' })
	@test('can fake query 2', { goodbye: 'taco' })
	protected static async canFakeQuery(expected: Record<string, any>) {
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
	protected static async canFakeMoreThanOneQueryAtATime() {
		this.fakeQuery('select * from people', () => [])
		this.fakeQuery('select * from cars', () => [])

		await this.query('select * from people')
		await this.query('select * from cars')
	}

	@test('passes through params 1', { hello: 'world' })
	@test('passes through params 2', { goodbye: 'taco' })
	protected static async passesThroughParams(expected: Record<string, any>) {
		const query = generateId()

		this.fakeQuery(query, (params) => {
			assert.isEqualDeep(params, expected)
		})

		await this.query(query, expected)
	}

	private static fakeQuery<T>(query: string, cb: FakeQueryHandler<T>) {
		this.db.fakeQuery(query, cb)
	}

	private static async assertThrowsQueryNotFaked(query: string) {
		const err = await assert.doesThrowAsync(() => this.query(query))
		errorAssert.assertError(err, 'QUERY_NOT_FAKED', { query })
	}

	private static query(query: string, params?: Record<string, any>) {
		return this.db.query(query, params)
	}
}
