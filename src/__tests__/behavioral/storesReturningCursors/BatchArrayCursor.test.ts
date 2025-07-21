import {
    test,
    suite,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import BatchArrayCursor, {
    BatchArrayCursorOptions,
} from '../../../cursors/BatchArrayCursor'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'

@suite()
export default class BatchArrayCursorTest extends AbstractStoreTest {
    private cursor!: BatchArrayCursor<Record<string, any>>
    @test()
    protected async throwsWithMissing() {
        //@ts-ignore
        const err = assert.doesThrow(() => new BatchArrayCursor())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['items'],
        })
    }

    @test()
    protected async canReturnNoRecords() {
        this.reload([])

        const results = await this.next()
        assert.isFalsy(results)

        await this.assertTotalRecords(0)
    }

    @test()
    protected async canReturnOneRecord() {
        const item = this.generateItemValues()

        this.reload([item])

        const results = await this.next()
        assert.isEqualDeep(results, [item])

        await this.assertTotalRecords(1)
    }

    @test()
    protected async batchesBy10ByDefault() {
        this.reloadWithTotalItems(11)
        await this.assertTotalInNextBatch(10)
        await this.assertTotalRecords(11)
    }

    @test()
    protected async canCustomizeBatchSize() {
        this.reloadWithTotalItems(11, { batchSize: 5 })
        await this.assertTotalInNextBatch(5)
        await this.assertTotalRecords(11)
    }

    @test()
    protected async splitsUpSoSecondBatchHasLeftOvers() {
        this.reloadWithTotalItems(6, { batchSize: 5 })
        await this.assertTotalInNextBatch(5)
        await this.assertTotalInNextBatch(1)
        await this.assertTotalRecords(6)
    }

    @test()
    protected async canSplitUpByDifferentBatchSize() {
        this.reloadWithTotalItems(6, { batchSize: 3 })
        await this.assertTotalInNextBatch(3)
        await this.assertTotalInNextBatch(3)
        await this.assertTotalRecords(6)
    }

    @test()
    protected async canSetOnNextResults() {
        this.reloadWithTotalItems(1)
        let wasHit = false
        this.cursor.setOnNextResults(() => {
            wasHit = true
            return []
        })

        await this.next()

        assert.isTrue(wasHit)
    }

    @test()
    protected async onNextGetsItems() {
        const items = this.reloadWithTotalItems(1)

        this.cursor.setOnNextResults((results) => {
            assert.isEqualDeep(results, items)
            return results
        })

        await this.next()
    }

    @test()
    protected async onNextGetsItemsInBatches() {
        const items = this.reloadWithTotalItems(11, { batchSize: 5 })
        const expected = [
            items.slice(0, 5),
            items.slice(5, 10),
            items.slice(10, 11),
        ]

        let allResults: Record<string, any>[][] = []

        this.cursor.setOnNextResults((results) => {
            allResults.push(results)
            return results
        })

        await this.next()
        await this.next()
        await this.next()

        assert.isEqualDeep(allResults, expected)
    }

    @test()
    protected async nextReturnsWhateverIsReturnedFromNextHandler() {
        this.reloadWithTotalItems(1)

        this.cursor.setOnNextResults(() => {
            return []
        })

        const actual = await this.next()
        assert.isLength(actual, 0)
    }

    @test()
    protected async supportsIterator() {
        const items = this.reloadWithTotalItems(3)

        const results = []
        for await (const result of this.cursor) {
            results.push(result)
        }

        assert.isEqualDeep(results[0], items)
    }

    @test()
    protected async iteratesAcrossBatches() {
        const items = this.reloadWithTotalItems(11, { batchSize: 5 })

        const results = []
        for await (const result of this.cursor) {
            results.push(result)
        }

        assert.isEqualDeep(results[0], items.slice(0, 5))
        assert.isEqualDeep(results[1], items.slice(5, 10))
        assert.isEqualDeep(results[2], items.slice(10, 11))
    }

    private async assertTotalInNextBatch(expected: number) {
        const results = await this.next()
        assert.isLength(results, expected)
    }

    private reloadWithTotalItems(
        total: number,
        options?: BatchArrayCursorOptions
    ) {
        const items = new Array(total)
            .fill(0)
            .map(() => this.generateItemValues())
        this.reload(items, options)
        return items
    }

    private generateItemValues() {
        return {
            id: generateId(),
        }
    }

    private async next() {
        return await this.cursor.next()
    }

    private async assertTotalRecords(expected: number) {
        assert.isEqual(await this.cursor.getTotalRecords(), expected)
    }

    private reload(
        items: Record<string, any>[],
        options?: BatchArrayCursorOptions
    ) {
        this.cursor = new BatchArrayCursor(items, options)
    }
}
