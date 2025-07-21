import { test, suite, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import CursorPager, { CursorQueryOptions } from '../../../cursors/CursorPager'
import { QueryOptions } from '../../../types/query.types'
import { SpyRecord } from '../usingStores/support/SpyStore'
import AbstractCursorTest from './AbstractCursorTest'

@suite()
export default class PagingWithCursorsTest extends AbstractCursorTest {
    @test()
    protected async queryToCursor() {
        assert.isFunction(CursorPager.prepareQueryOptions)
    }

    @test()
    protected throwsWithoutLimit() {
        //@ts-ignore
        const err = assert.doesThrow(() => CursorPager.prepareQueryOptions({}))
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['limit'],
        })
    }

    @test('throws with limit 0', 0)
    @test('throws with limit -1', -1)
    protected async throwsWithLimitLessThan1(limit: number) {
        const err = assert.doesThrow(() =>
            CursorPager.prepareQueryOptions({
                limit,
                next: null,
                previous: null,
            })
        )
        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['limit'],
        })
    }

    @test()
    protected addsInIfSortExists() {
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
    protected maintainsExistingQueryOptions() {
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
    protected doesNotAddIdFieldTwiceToQueryOptions() {
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
    protected incrementsLimitBy1ForPeakAhead() {
        const { limit } = this.prepare({ limit: 12 })
        assert.isEqual(limit, 13)
    }

    @test()
    protected async findReturnsEmptyCursorWithNoRecords() {
        const results = await this.findWithOptions()

        assert.isEqualDeep(results, {
            records: [],
            next: null,
            previous: null,
        })
    }

    @test('passes expected params 1', { firstName: 'hello' })
    @test('passes expected params 2', { lastName: 'there!' })
    protected async callsFindOnTheStoreWithExpectedParams(
        query: Partial<SpyRecord>
    ) {
        await this.find(query)

        assert.isEqualDeep(this.lastFindArgs[0], query)
        this.assertLastFindOptionsEqual({})
    }

    @test()
    protected async passesProperlyPreppedValues() {
        const options = {
            includeFields: ['firstName', 'lastName'],
            limit: 20,
        }

        await this.findWithOptions(options)
        this.assertLastFindOptionsEqual(options)
    }

    @test()
    protected async returnsRecordsFromSpy() {
        const first = await this.createRecord()
        const results = await this.findWithOptions()
        assert.isEqualDeep(results.records, [first])
    }

    @test()
    protected async returnsCorrectNumberOfRecords() {
        const results = await this.createRecordsAndFind({
            toCreate: 2,
            limit: 1,
        })
        assert.isLength(results.records, 1)
    }

    @test()
    protected async nextIsStringIfMoreRecordsExist() {
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
    protected async canUseNextToContinueGettingResults() {
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
    protected async previousIsStringIfPastFirstPage() {
        await this.createRecords(4)
        const { next } = await this.findWithOptions({ limit: 2 })
        const { previous } = await this.findWithOptions({ limit: 2, next })
        assert.isString(previous)
    }

    @test()
    protected async wontMissRecordAddedAfterPagingAsc() {
        const options = this.generateSortByFirstNameLimit2('asc')
        const created = await this.createRecords(4)

        const { secondRecords } = await this.assertMissedRecordPulledNextPage(
            options,
            'Record 00'
        )
        assert.isEqual(secondRecords[1].firstName, created[2].firstName)
    }

    @test()
    protected async wontMissRecordAddedAfterPagingDesc() {
        const options = this.generateSortByFirstNameLimit2('desc')
        const created = await this.createRecordsAndReverse(4)

        const { secondRecords } = await this.assertMissedRecordPulledNextPage(
            options,
            'Record 5'
        )

        assert.isEqual(secondRecords[1].firstName, created[2].firstName)
    }

    @test()
    protected async picksUpNewRecordsAfter2ndPage() {
        const options = this.generateSortByFirstNameLimit2('desc')

        const names = ['6', '5', '4', '3', '2', '1', '0']
        names.reverse()

        await this.createRecordsNamed(names)

        const { next } = await this.assertFindResultsEqual(options, ['6', '5'])

        const { next: next2 } = await this.assertFindResultsEqual(
            { ...options, next },
            ['4', '3']
        )

        await this.assertFindResultsEqual({ ...options, next: next2 }, [
            '2',
            '1',
        ])
    }

    @test()
    protected async canPageWhenSortingByIdAsc() {
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
    protected async canSortAllSameNameDesc(direction: 'asc' | 'desc') {
        const { expected, options } =
            await this.generateSortOptionsCreateRecordsNameAllRyan(direction)

        expected.reverse()

        await this.assert2PagesReturnExpectedResults(options, expected)
    }

    @test()
    protected async canGoToPreviousPage() {
        await this.createRecordsNamed([
            '10',
            '9',
            '8',
            '7',
            '6',
            '5',
            '4',
            '3',
            '2',
            '1',
        ])

        await this.assertExpectedResultsPagingForwardAndBackwards(
            ['1', '2'],
            ['3', '4'],
            ['5', '6'],
            ['7', '8'],
            ['5', '6'],
            ['3', '4']
        )
    }

    @test()
    protected async canGoToPreviousSortingByNonIdField() {
        await this.createRecordsNamed([
            '9',
            '8',
            '7',
            '6',
            '5',
            '4',
            '3',
            '2',
            '1',
        ])

        const options = this.generateSortByFirstNameLimit2('desc')
        await this.assertExpectedResultsPagingForwardAndBackwards(
            ['9', '8'],
            ['7', '6'],
            ['5', '4'],
            ['3', '2'],
            ['5', '4'],
            ['7', '6'],
            options
        )
    }

    @test()
    protected async canGoToPreviousSortingByNonIdFieldAsc() {
        await this.createRecordsNamed([
            '9',
            '8',
            '7',
            '6',
            '5',
            '4',
            '3',
            '2',
            '1',
        ])

        const options = this.generateSortByFirstNameLimit2('asc')
        await this.assertExpectedResultsPagingForwardAndBackwards(
            ['1', '2'],
            ['3', '4'],
            ['5', '6'],
            ['7', '8'],
            ['5', '6'],
            ['3', '4'],
            options
        )
    }

    @test()
    protected async canPageBackwordsWithSameName() {
        const all = await this.createRecordsNamed([
            'ryan',
            'ryan',
            'ryan',
            'ryan',
        ])
        const options = this.generateSortByFirstNameLimit2('asc')

        const firstExpected = [all[3].id!, all[2].id!]
        const { next } = await this.assertFindResultsEqual(
            { ...options },
            firstExpected,
            'id'
        )

        const { previous } = await this.assertFindResultsEqual(
            {
                ...options,
                next,
            },
            [all[1].id!, all[0].id!],
            'id'
        )

        await this.assertFindResultsEqual(
            {
                ...options,
                previous,
            },
            firstExpected,
            'id'
        )
    }

    @test()
    protected async canUseNextAfterForwardAndBackwards() {
        await this.createRecordsNamed([
            '9',
            '8',
            '7',
            '6',
            '5',
            '4',
            '3',
            '2',
            '1',
        ])

        const options = { limit: 2 }
        const { next } = await this.assertFindResultsEqual(options, ['1', '2'])
        const { previous } = await this.assertFindResultsEqual(
            { ...options, next },
            ['3', '4']
        )

        const { next: next2 } = await this.assertFindResultsEqual(
            { ...options, previous },
            ['1', '2']
        )

        await this.assertFindResultsEqual({ ...options, next: next2 }, [
            '3',
            '4',
        ])
    }

    private async assertExpectedResultsPagingForwardAndBackwards(
        expectedFirst: string[],
        expectedNext1: string[],
        expectedNext2: string[],
        expectedNext3: string[],
        expectedPrevious1: string[],
        expectedPrevious2: string[],
        options: Partial<CursorQueryOptions> = {}
    ) {
        const { next } = await this.assert2ResultsEqual(options, expectedFirst)
        const { next: next2 } = await this.assert2ResultsEqual(
            { ...options, next },
            expectedNext1
        )
        const { next: next3 } = await this.assert2ResultsEqual(
            { ...options, next: next2 },
            expectedNext2
        )

        const { previous } = await this.assert2ResultsEqual(
            { ...options, next: next3 },
            expectedNext3
        )

        const { previous: previous2 } = await this.assert2ResultsEqual(
            { ...options, previous },
            expectedPrevious1
        )

        await this.assert2ResultsEqual(
            { ...options, previous: previous2 },
            expectedPrevious2
        )
    }

    private async assert2PagesReturnExpectedResults(
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

    private async generateSortOptionsCreateRecordsNameAllRyan(
        order: 'asc' | 'desc'
    ) {
        const options = this.generateSortByFirstNameLimit2(order)
        const expected = await this.createRecords(5)
        await this.spyStore.update({}, { firstName: 'Ryan' })
        return { expected, options }
    }

    private async createRecordsAndReverse(total: number) {
        const created = await this.createRecords(total)
        created.reverse()
        return created
    }

    private async assertMissedRecordPulledNextPage(
        options: CursorQueryOptions,
        firstName: string
    ) {
        const { next } = await this.findWithOptions(options)
        const created = await this.createRecord({ firstName })
        const { records } = await this.findWithOptions({ ...options, next })
        assert.isEqual(records[0].firstName, created.firstName)

        return { secondRecords: records }
    }

    private async assert2ResultsEqual(
        options: Partial<CursorQueryOptions>,
        expected: string[]
    ) {
        return await this.assertFindResultsEqual(
            {
                limit: 2,
                ...options,
            },
            expected
        )
    }

    private async createRecordsNamed(names: string[]) {
        return await Promise.all(
            names.map((n) => this.createRecord({ firstName: n }))
        )
    }

    private async assertFindResultsEqual(
        options: Partial<CursorQueryOptions>,
        expected: string[],
        fieldToCheck: 'firstName' | 'id' = 'firstName'
    ) {
        const { next, records, previous } = await this.findWithOptions({
            ...options,
        })
        assert.isEqualDeep(
            records.map((r) => r[fieldToCheck]),
            expected
        )
        return { next, previous, records }
    }

    private assertRecordsAreDifferent(first: SpyRecord, second: SpyRecord) {
        assert.isNotEqual(first.id, second.id)
    }

    private assertLastFindOptionsEqual(options: Partial<CursorQueryOptions>) {
        assert.isEqualDeep(
            this.mixinDefaultOptions(this.lastFindArgs[1]),
            this.prepare(options)
        )
    }

    private assertQueryOptionsNotChanged(options: QueryOptions) {
        this.assertPreppedOptionsEqual(options, options)
    }

    private assertPreppedOptionsEqualExpected(options: QueryOptions) {
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

    private assertPreppedOptionsEqual(
        options: QueryOptions,
        expected: QueryOptions
    ) {
        assert.isEqualDeep(
            this.prepare(options),
            this.mixinDefaultOptions({
                limit: 11,
                ...expected,
            })
        )
    }

    private prepare(options: QueryOptions) {
        return CursorPager.prepareQueryOptions(
            this.mixinDefaultOptions({
                limit: 10,
                ...options,
            })
        )
    }

    private get lastFindArgs() {
        return this.spyStore.findArgs[0]
    }

    private generateSortByFirstNameLimit2(
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
