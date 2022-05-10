import { test, assert } from '@sprucelabs/test'
import CursorPager from '../../../cursors/CursorPager'
import CursorPagerFaker from '../../../cursors/CursorPagerFaker'
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
		const cb = async () => {
			return {
				next: null,
				previous: null,
				records: [],
			}
		}
		CursorPagerFaker.setResponse(cb)

		assert.isEqual(CursorPager.find, cb as any)

		await this.createRecords(10)
		await this.assertTotalRecords(0)

		await CursorPagerFaker.beforeEach()

		await this.assertTotalRecords(10)
	}

	private static async assertTotalRecords(expected: number) {
		const { records } = await this.find({})
		assert.isLength(records, expected)
	}
}
