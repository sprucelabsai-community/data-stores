import { test, assert, generateId } from '@sprucelabs/test-utils'
import { FindBatchOptions } from 'cursors/BatchCursor'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'

export default class FindWithCursorTest extends AbstractStoreTest {
	private static query?: undefined | Record<string, any>

	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.query = undefined
	}

	@test()
	protected static async nothingByDefailt() {
		const first = await this.firstBatch()
		assert.isFalsy(first)
	}

	@test()
	protected static async returnsOne() {
		await this.createOne()
		await this.assertFirstBatchSize(1)
	}

	@test()
	protected static async returnsTwo() {
		await this.createMany(2)
		await this.assertFirstBatchSize(2)
	}

	@test()
	protected static async canSetBatchSize() {
		await this.createMany(2)
		await this.assertFirstBatchSize(1, { batchSize: 1 })
	}

	@test()
	protected static async passesQueryThrough() {
		const [first] = await this.createMany(2)
		this.query = {
			requiredForCreate: first.requiredForCreate,
		}
		await this.assertFirstBatchSize(1)
	}

	@test()
	protected static async defaultsToBatchSizeOf10() {
		await this.createMany(11)
		await this.assertFirstBatchSize(10)
	}

	@test()
	protected static async honorsIncludeFields() {
		await this.createOne()
		//@ts-ignore
		const batch = await this.findBatch({ includeFields: ['id'] })
		const [first] = (await batch.next()) ?? []
		//@ts-ignore
		assert.isEqualDeep(first, { id: first!.id })
	}

	@test()
	protected static async returnsAllfieldsByDefault() {
		const { first, created } = await this.createOneAndFindFirst()
		assert.isEqualDeep(first, created)
	}

	@test()
	protected static async honorsPrivateFields() {
		const { first } = await this.createOneAndFindFirst({
			shouldIncludePrivateFields: true,
		})
		const match = await this.dummyStore.findOne(
			{},
			{ shouldIncludePrivateFields: true }
		)

		assert.isEqualDeep(first, match)
	}

	@test()
	protected static async nextBatchFindsNextResults() {
		await this.createMany(11)
		const batch = await this.findBatch()
		const first = await batch.next()
		const second = await batch.next()

		assert.isLength(first, 10)
		assert.isLength(second, 1)
	}

	@test()
	protected static async finds4Batches() {
		await this.createMany(31)
		const batch = await this.findBatch()
		const first = await batch.next()
		const second = await batch.next()
		const third = await batch.next()
		const fourth = await batch.next()

		assert.isLength(first, 10)
		assert.isLength(second, 10)
		assert.isLength(third, 10)
		assert.isLength(fourth, 1)
	}

	private static async createOneAndFindFirst(
		options?: Partial<FindBatchOptions>
	) {
		const created = await this.createOne()
		const batch = await this.findBatch(options)
		const [first] = (await batch.next()) ?? []
		return { first, created }
	}

	private static async assertFirstBatchSize(
		expected: number,
		options?: Partial<FindBatchOptions>
	) {
		const first = await this.firstBatch(options)
		assert.isLength(first, expected)
	}

	private static async createOne() {
		const [one] = await this.createMany(1)
		return one
	}

	private static async createMany(total: number) {
		return await this.dummyStore.create(
			new Array(total).fill(0).map(() => this.generateDummyValues())
		)
	}

	private static generateDummyValues() {
		return {
			phoneNumber: '555-555-5555',
			requiredForCreate: generateId(),
		}
	}

	private static async findBatch(options?: Partial<FindBatchOptions>) {
		return await this.dummyStore.findBatch(this.query, {
			...options,
		})
	}

	private static async firstBatch(options?: Partial<FindBatchOptions>) {
		const batch = await this.findBatch(options)
		const first = await batch.next()
		return first
	}
}
