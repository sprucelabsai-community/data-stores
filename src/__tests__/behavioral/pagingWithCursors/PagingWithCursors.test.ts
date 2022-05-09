import { test, assert } from '@sprucelabs/test'
import { errorAssert } from '@sprucelabs/test-utils'
import { QueryOptions } from '../../../types/query.types'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'
import { SpyRecord } from '../usingStores/support/SpyStore'
import CursorPager, { CursorQueryOptions } from './CursorPager'

export default class PagingWithCursorsTest extends AbstractStoreTest {
	private static spyRecordCount = 0

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.spyRecordCount = 0
	}

	@test()
	protected static async queryToCursor() {
		assert.isFunction(CursorPager.prepareQueryOptions)
	}

	@test()
	protected static throwsWithoutLimit() {
		//@ts-ignore
		const err = assert.doesThrow(() => CursorPager.prepareQueryOptions({}))
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['limit'],
		})
	}

	@test()
	protected static addsInIfSortExists() {
		this.assertPreppedOptionsEqualExpected({
			sort: [
				{
					field: 'firstName',
					direction: 'asc',
				},
			],
		})
	}

	@test()
	protected static maintainsExistingQueryOptions() {
		this.assertPreppedOptionsEqualExpected({
			includeFields: [],
			sort: [
				{
					field: 'firstName',
					direction: 'asc',
				},
			],
		})
	}

	@test()
	protected static doesNotAddIdFieldTwiceToQueryOptions() {
		this.assertQueryOptionsNotChanged({
			sort: [{ field: 'id', direction: 'asc' }],
		})
		this.assertQueryOptionsNotChanged({
			sort: [
				{ field: 'firstName', direction: 'asc' },
				{ field: 'id', direction: 'asc' },
			],
		})
	}

	@test()
	protected static incrementsLimitBy1ForPeakAhead() {
		const { limit } = this.prepare({ limit: 12 })
		assert.isEqual(limit, 13)
	}

	@test()
	protected static async findReturnsEmptyCursorWithNoRecords() {
		const results = await this.findWithOptions()

		assert.isEqualDeep(results, {
			records: [],
			next: null,
			previous: null,
		})
	}

	@test('passes expected params 1', { firstName: 'hello' })
	@test('passes expected params 2', { lastName: 'there!' })
	protected static async callsFindOnTheStoreWithExpectedParams(
		query: Partial<SpyRecord>
	) {
		await this.find(query)

		assert.isEqualDeep(this.lastFindArgs[0], query)
		this.assertLastFindOptionsEqual({})
	}

	@test()
	protected static async passesProperlyPreppedValues() {
		const options = {
			includeFields: ['firstName', 'lastName'],
			limit: 20,
		}

		await this.findWithOptions(options)
		this.assertLastFindOptionsEqual(options)
	}

	@test()
	protected static async returnsRecordsFromSpy() {
		const first = await this.createRecord()
		const results = await this.findWithOptions()
		assert.isEqualDeep(results.records, [first])
	}

	@test()
	protected static async returnsCorrectNumberOfRecords() {
		const results = await this.createRecordsAndFind({ toCreate: 2, limit: 1 })
		assert.isLength(results.records, 1)
	}

	@test()
	protected static async nextIsStringIfMoreRecordsExist() {
		const {
			next,
			records: [first],
		} = await this.createRecordsAndFind({ toCreate: 2, limit: 1 })

		assert.isString(next)

		const {
			records: [second],
		} = await this.findWithOptions({ next, limit: 1 })

		this.assertRecordsAreDifferent(first, second)
	}

	@test()
	protected static async canUseNextToContinueGettingResults() {
		await this.createRecords(10)

		const {
			next,
			records: [, second],
		} = await this.findWithOptions({ limit: 2 })

		const {
			records: [third],
		} = await this.findWithOptions({ next, limit: 1 })

		this.assertRecordsAreDifferent(second, third)
	}

	@test()
	protected static async previousIsStringIfPastFirstPage() {
		await this.createRecords(4)
		const { next } = await this.findWithOptions({ limit: 2 })
		const { previous } = await this.findWithOptions({ limit: 2, next })
		assert.isString(previous)
	}

	@test()
	protected static async wontMissRecordAddedAfterPagingAsc() {
		const options = this.generateSortByFirstNameLimit2('asc')
		const created = await this.createRecords(4)

		const { secondRecords } = await this.assertMissedRecordPulledNextPage(
			options,
			'Record 00'
		)
		assert.isEqual(secondRecords[1].firstName, created[2].firstName)
	}

	@test()
	protected static async wontMissRecordAddedAfterPagingDesc() {
		const options = this.generateSortByFirstNameLimit2('desc')
		const created = await this.createRecordsAndReverse(4)

		const { secondRecords } = await this.assertMissedRecordPulledNextPage(
			options,
			'Record 5'
		)

		assert.isEqual(secondRecords[1].firstName, created[2].firstName)
	}

	@test()
	protected static async picksUpNewRecordsAfter2ndPage() {
		const options = this.generateSortByFirstNameLimit2('desc')

		const names = ['6', '5', '4', '3', '2', '1', '0']
		names.reverse()

		await this.createRecordsNamed(names)

		const { next } = await this.assertResultsEqual(options, ['6', '5'])

		const { next: next2 } = await this.assertResultsEqual(
			{ ...options, next },
			['4', '3']
		)

		await this.assertResultsEqual({ ...options, next: next2 }, ['2', '1'])
	}

	@test()
	protected static async canPageWhenSortingByIdAsc() {
		const expected = await this.createRecords(5)

		const options: CursorQueryOptions = this.mixinDefaultOptions({
			limit: 2,
			sort: [
				{
					field: 'id',
					direction: 'asc',
				},
			],
		})

		const { next, records } = await this.findWithOptions(options)

		assert.isEqualDeep(records, [expected[0], expected[1]])

		const { records: records2 } = await this.findWithOptions({
			...options,
			next,
		})

		assert.isEqualDeep(records2, [expected[2], expected[3]])
	}

	@test('can sort all same name desc', 'desc')
	@test('can sort all same name asc', 'asc')
	protected static async canSortAllSameNameDesc(direction: 'asc' | 'desc') {
		const { expected, options } =
			await this.generateSortOptionsCreateRecordsNameAllRyan(direction)

		expected.reverse()

		await this.assert2PagesReturnExpectedResults(options, expected)
	}

	@test()
	protected static async canGoToPreviousPage() {
		await this.createRecordsNamed(['0', '1', '2', '3', '4', '5'])

		const { next } = await this.assert2ResultsEqual({}, ['5', '4'])
		const { next: next2 } = await this.assert2ResultsEqual({ next }, ['3', '2'])
		const { previous } = await this.assert2ResultsEqual({ next: next2 }, [
			'1',
			'0',
		])

		const { previous: previous2 } = await this.assert2ResultsEqual(
			{ previous },
			['3', '2']
		)
		await this.assert2ResultsEqual({ previous: previous2 }, ['5', '4'])
	}

	private static async assert2PagesReturnExpectedResults(
		options: CursorQueryOptions,
		expected: SpyRecord[]
	) {
		const { records, next } = await this.findWithOptions(options)

		assert.isEqualDeep(
			[expected[0].id, expected[1].id],
			[records[0].id, records[1].id]
		)

		const { records: records2 } = await this.findWithOptions({
			...options,
			next,
		})

		assert.isEqualDeep(
			[expected[2].id, expected[3].id],
			[records2[0].id, records2[1].id]
		)
	}

	private static async generateSortOptionsCreateRecordsNameAllRyan(
		order: 'asc' | 'desc'
	) {
		const options = this.generateSortByFirstNameLimit2(order)
		const expected = await this.createRecords(5)
		await this.spyStore.update({}, { firstName: 'Ryan' })
		return { expected, options }
	}

	private static async createRecordsAndReverse(total: number) {
		const created = await this.createRecords(total)
		created.reverse()
		return created
	}

	private static async assertMissedRecordPulledNextPage(
		options: CursorQueryOptions,
		firstName: string
	) {
		const { next } = await this.findWithOptions(options)
		const created = await this.createRecord({ firstName })
		const { records } = await this.findWithOptions({ ...options, next })
		assert.isEqual(records[0].firstName, created.firstName)

		return { secondRecords: records }
	}

	private static async assert2ResultsEqual(
		options: Partial<CursorQueryOptions>,
		expected: string[]
	) {
		return await this.assertResultsEqual(
			{
				limit: 2,
				...options,
			},
			expected
		)
	}

	private static async createRecordsNamed(names: string[]) {
		await Promise.all(names.map((n) => this.createRecord({ firstName: n })))
	}

	private static async assertResultsEqual(
		options: Partial<CursorQueryOptions>,
		expected: string[]
	) {
		const { next, records, previous } = await this.findWithOptions({
			...options,
		})
		assert.isEqualDeep(
			records.map((r) => r.firstName),
			expected
		)
		return { next, previous }
	}

	private static assertRecordsAreDifferent(
		first: SpyRecord,
		second: SpyRecord
	) {
		assert.isNotEqual(first.id, second.id)
	}

	private static async createRecordsAndFind(options: {
		toCreate: number
		limit: number
	}) {
		const { toCreate, limit } = options
		await this.createRecords(toCreate)
		const results = await this.findWithOptions({ limit })
		return results
	}

	private static async createRecords(total: number) {
		return await Promise.all(
			new Array(total).fill(0).map(() => this.createRecord())
		)
	}

	private static async createRecord(values?: SpyRecord) {
		return await this.spyStore.createOne({
			firstName: `Record ${this.spyRecordCount++}`,
			...values,
		})
	}

	private static assertLastFindOptionsEqual(
		options: Partial<CursorQueryOptions>
	) {
		assert.isEqualDeep(this.lastFindArgs[1], this.prepare(options))
	}

	private static async find(
		query: Partial<SpyRecord>,
		options?: Partial<CursorQueryOptions>
	) {
		return await CursorPager.find(
			this.spyStore,
			query,
			this.mixinDefaultOptions({
				limit: 10,
				...options,
			})
		)
	}

	private static async findWithOptions(options?: Partial<CursorQueryOptions>) {
		return await this.find(
			{},
			{
				...options,
			}
		)
	}

	private static assertQueryOptionsNotChanged(options: QueryOptions) {
		this.assertPreppedOptionsEqual(options, options)
	}

	private static assertPreppedOptionsEqualExpected(options: QueryOptions) {
		this.assertPreppedOptionsEqual(options, {
			...options,
			sort: [
				...(options.sort ?? []),
				{
					field: 'id',
					direction: 'desc',
				},
			],
		})
	}

	private static mixinDefaultOptions(
		options: Partial<QueryOptions> & { limit: number }
	): CursorQueryOptions {
		return {
			next: null,
			previous: null,
			...options,
		}
	}

	private static assertPreppedOptionsEqual(
		options: QueryOptions,
		expected: QueryOptions
	) {
		assert.isEqualDeep(this.prepare(options), {
			limit: 11,
			...expected,
		})
	}

	private static prepare(options: QueryOptions) {
		return CursorPager.prepareQueryOptions({
			limit: 10,
			...options,
		})
	}

	private static get lastFindArgs() {
		return this.spyStore.findArgs[0]
	}

	private static generateSortByFirstNameLimit2(
		direction: 'asc' | 'desc'
	): CursorQueryOptions {
		return this.mixinDefaultOptions({
			limit: 2,
			sort: [
				{
					field: 'firstName',
					direction,
				},
			],
		})
	}
}
