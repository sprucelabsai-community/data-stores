import { cloneDeep } from '@sprucelabs/schema'
import { test, suite, assert, errorAssert } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil, {
    DatabaseAssertionName,
} from '../../../tests/databaseAssertUtil'
import pluckAssertionMethods from '../../../tests/pluckAssertionMethods'
import mongoConnect from '../../support/mongoConnect'

@suite()
export default class DatabaseAssertUtilTest extends AbstractDatabaseTest {
    private dbAssert!: typeof databaseAssertUtil
    protected hits: string[] = []

    protected async beforeEach() {
        await super.beforeEach()
        this.hits = []
        this.dbAssert = cloneDeep(databaseAssertUtil)
    }

    @test()
    protected async canInvokeEveryTestWithOneConnect() {
        assert.isFunction(databaseAssertUtil.runSuite)
    }

    @test()
    protected async throwsWhenMissingConnect() {
        const err = await assert.doesThrowAsync(() =>
            //@ts-ignore
            databaseAssertUtil.runSuite()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['connect'],
        })
    }

    @test()
    protected async canSpecifyTests() {
        this.attachHitCounter()

        await this.runTestsAndAssertActuallyRun(['assertCanSortDesc'])
        await this.runTestsAndAssertActuallyRun([
            'assertCanQueryWithOr',
            'assertCanLimitResults',
        ])
    }

    @test()
    protected async runSuiteHitsAllAssertions() {
        const keys = this.pluckTests()

        const hits: Record<string, boolean> = {}
        const expected: Record<string, boolean> = {}

        for (const key of keys) {
            expected[key] = true
            //@ts-ignore
            this.dbAssert[key] = () => {
                hits[key] = true
            }
        }

        await this.runSuite()

        assert.isEqualDeep(hits, expected)
    }

    @test('can ignore single test "assertCanUpdate"', 'assertCanUpdate')
    @test('can ignore single test "assertCanCount"', 'assertCanCount')
    protected async canIgnoreTests(assertionName: DatabaseAssertionName) {
        this.attachHitCounter()
        const expected = this.pluckTests([assertionName])
        //@ts-ignore
        await this.runSuite([`!${assertionName}`])
        this.assertTestsRun(expected)
    }

    @test('throws when ignoring expcept for 2nd test', [
        '!assertCanUpdate',
        'assertCanCreateIndex',
    ])
    @test('throws when ignoring expcept for 1st test', [
        'assertCanUpdate',
        '!assertCanCreateIndex',
    ])
    protected async throwsWithIgnoredAndIncludedTests(
        assertionNames: DatabaseAssertionName[]
    ) {
        const err = await assert.doesThrowAsync(() =>
            this.runSuite(assertionNames)
        )

        errorAssert.assertError(err, 'INVALID_PARAMETERS', {
            parameters: ['tests'],
        })
    }

    @test()
    protected async canIgnoreMultipleTests() {
        this.attachHitCounter()
        const expected = this.pluckTests([
            'assertCanCreateMany',
            'assertCanCreateUniqueIndex',
        ])
        await this.runSuite([
            '!assertCanCreateMany',
            '!assertCanCreateUniqueIndex',
        ])
        this.assertTestsRun(expected)
    }

    private pluckTests(
        ignore?: DatabaseAssertionName[]
    ): DatabaseAssertionName[] {
        return pluckAssertionMethods(this.dbAssert).filter(
            (key) =>
                (!ignore ||
                    ignore.indexOf(key as DatabaseAssertionName) === -1) &&
                key !== 'assertHasLowerCaseToCamelCaseMappingEnabled'
        ) as DatabaseAssertionName[]
    }

    private async runTestsAndAssertActuallyRun(tests: DatabaseAssertionName[]) {
        await this.runSuite(tests)
        this.assertTestsRun(tests)
        this.hits = []
    }

    private assertTestsRun(tests: DatabaseAssertionName[]) {
        this.hits.sort()
        tests.sort()

        assert.isEqualDeep(this.hits, tests)
    }

    private async runSuite(tests?: DatabaseAssertionName[]) {
        await this.dbAssert.runSuite(mongoConnect, tests)
    }

    private attachHitCounter() {
        const keys = pluckAssertionMethods(this.dbAssert)

        for (const key of keys) {
            //@ts-ignore
            this.dbAssert[key] = async () => {
                this.hits.push(key)
            }
        }
    }
}
