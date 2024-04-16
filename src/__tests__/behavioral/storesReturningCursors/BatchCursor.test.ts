import { test, assert, generateId, errorAssert } from '@sprucelabs/test-utils'
import BatchCursorImpl, { FindBatchOptions } from '../../../cursors/BatchCursor'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'

export default class FindWithCursorTest extends AbstractStoreTest {
    private static query?: undefined | Record<string, any>

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.query = undefined
        BatchCursorImpl.Class = SpyCursor
    }

    @test()
    protected static async throwsWhenMissingRequired() {
        //@ts-ignore
        const err = await assert.doesThrowAsync(() => BatchCursorImpl.Cursor())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['store'],
        })
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
        const cursor = await this.findBatch({ includeFields: ['id'] })
        const [first] = (await cursor.next()) ?? []
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
        const cursor = await this.findBatch()
        const first = await cursor.next()
        const second = await cursor.next()

        assert.isLength(first, 10)
        assert.isLength(second, 1)
    }

    @test()
    protected static async finds4Batches() {
        await this.createMany(31)
        const cursor = await this.findBatch()
        const first = await cursor.next()
        const second = await cursor.next()
        const third = await cursor.next()
        const fourth = await cursor.next()

        assert.isLength(first, 10)
        assert.isLength(second, 10)
        assert.isLength(third, 10)
        assert.isLength(fourth, 1)
    }

    @test('can map next results 1', [])
    @test('can map next results 2', [{ test: 1 }])
    protected static async canMapNextResults(expected: Record<string, any>[]) {
        await this.createMany(1)
        const cursor = await this.findBatch()

        cursor.setOnNextResults(() => {
            return expected
        })

        const all = await cursor.next()
        assert.isEqualDeep(all, expected)
    }

    @test()
    protected static async passesResultsToOnNextResults() {
        await this.createMany(11)

        const first = [this.generateDummyValues()]
        const second = [this.generateDummyValues()]
        const overridden = [first, second]

        const cursor = await this.findBatch({ batchSize: 1 })

        cursor.setOnNextResults(() => {
            return overridden.shift()!
        })

        const actualFirst = await cursor.next()
        const actualSecond = await cursor.next()

        assert.isEqualDeep(actualFirst, first)
        assert.isEqualDeep(actualSecond, second)
    }

    @test()
    protected static async passesActualRecordsToOnNextResults() {
        await this.createMany(2)
        const cursor = await this.findBatch()

        let passedResults: Record<string, any>[] = []

        cursor.setOnNextResults((results) => {
            passedResults = results
            return results
        })

        const actual = await cursor.next()

        assert.isLength(actual, 2)
        assert.isEqualDeep(actual, passedResults)
    }

    @test()
    protected static async canGetTotalRecords() {
        await this.assertTotalRecords(0)
        await this.createOne()
        await this.assertTotalRecords(1)
        await this.createMany(2)
        await this.assertTotalRecords(3)
    }

    @test()
    protected static async totalRecordsHonorsQuery() {
        const created = await this.createOne()
        this.query = {
            requiredForCreate: generateId(),
        }
        await this.assertTotalRecords(0)
        this.query = {
            requiredForCreate: created.requiredForCreate,
        }
        await this.assertTotalRecords(1)
    }

    @test()
    protected static async supportIteration() {
        const items = await this.createMany(3)
        const cursor = await this.findBatch()
        const results = []
        for await (const result of cursor) {
            results.push(result)
        }

        assert.isEqualDeep(results[0], items)
    }

    @test()
    protected static async supportIterationWithMultipleBatches() {
        const items = await this.createMany(11)
        const cursor = await this.findBatch()
        const results = []
        for await (const result of cursor) {
            results.push(result)
        }

        assert.isEqualDeep(results[0], items.slice(0, 10))
        assert.isEqualDeep(results[1], items.slice(10, 11))
    }

    @test()
    protected static async nextHonorsQueryWith$or() {
        const [event, event2] = await this.createMany(4)
        this.query = {
            $or: [
                {
                    requiredForCreate: event.requiredForCreate,
                },
                {
                    requiredForCreate: event2.requiredForCreate,
                },
            ],
        }
        const cursor = await this.findBatch({ batchSize: 2 })
        const matches = await cursor.next()

        assert.isEqualDeep(matches, [event, event2])

        const next = await cursor.next()
        assert.isNull(next)
    }

    @test()
    protected static async queryIsNotMutatedOnQuery() {
        const [event] = await this.createMany(20)

        this.query = {
            requiredForCreate: event.requiredForCreate,
        }

        const cursor = await this.findBatch({ batchSize: 2 })
        await cursor.next()

        assert.isEqualDeep(this.query, cursor.getQuery())
    }

    private static async assertTotalRecords(
        expected: number,
        options?: Partial<FindBatchOptions>
    ) {
        const cursor = await this.findBatch(options)
        const total = await cursor.getTotalRecords()
        assert.isEqual(total, expected)
    }

    private static async createOneAndFindFirst(
        options?: Partial<FindBatchOptions>
    ) {
        const created = await this.createOne()
        const cursor = await this.findBatch(options)
        const [first] = (await cursor.next()) ?? []
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
        return (await this.dummyStore.findBatch(this.query, {
            ...options,
        })) as SpyCursor
    }

    private static async firstBatch(options?: Partial<FindBatchOptions>) {
        const cursor = await this.findBatch(options)
        const first = await cursor.next()
        return first
    }
}

class SpyCursor extends BatchCursorImpl<Record<string, any>> {
    public constructor(...args: any[]) {
        //@ts-ignore
        super(...args)
    }
    public getQuery() {
        return this.query
    }
}
