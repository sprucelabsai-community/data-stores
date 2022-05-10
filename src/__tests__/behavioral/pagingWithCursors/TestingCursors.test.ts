import { test, assert } from '@sprucelabs/test'
import CursorPagerFaker from '../../../cursors/CursorPagerFaker'
import generateId from '../../../utilities/generateId'
import { SpyRecord } from '../usingStores/support/SpyStore'
import AbstractCursorTest from './AbstractCursorTest'

export default class TestingCursorsTest extends AbstractCursorTest {
	protected static async beforeEach() {
		await super.beforeEach()
		await CursorPagerFaker.beforeEach()
	}

	@test()
	protected static async hasBeforeEach() {
		assert.isFunction(CursorPagerFaker.beforeEach)
		assert.isFunction(CursorPagerFaker.setResponse)
	}

	@test()
	protected static async canForResponseToCursor() {
		const next = generateId()
		const previous = generateId()
		const records: SpyRecord[] = [{ firstName: generateId() }]
		const expectedResponse = {
			next,
			previous,
			records,
		}

		const cb = async () => {
			return expectedResponse
		}
		CursorPagerFaker.setResponse(cb)

		await this.createRecords(10)
		const response = await this.assertTotalRecords(1)

		assert.isEqualDeep(response, expectedResponse)

		await CursorPagerFaker.beforeEach()

		await this.assertTotalRecords(10)
	}

	@test()
	protected static async thingsNotSuppliedHaveDefaults() {
		CursorPagerFaker.setResponse(async () => ({}))
		const response = await this.find({})
		assert.isEqualDeep(response, { next: null, previous: null, records: [] })
	}

	private static async assertTotalRecords(expected: number) {
		const { records, next, previous } = await this.find({})
		assert.isLength(records, expected)
		return { records, next, previous }
	}
}
