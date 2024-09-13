import { cloneDeep } from '@sprucelabs/schema'
import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil, {
    DatabaseAssertionName,
} from '../../../tests/databaseAssertUtil'
import pluckAssertionMethods from '../../../tests/pluckAssertionMethods'
import mongoConnect from '../../support/mongoConnect'

export default class DatabaseAssertUtilTest extends AbstractDatabaseTest {
    private static dbAssert: typeof databaseAssertUtil
    protected static hits: string[] = []

    protected static async beforeEach() {
        await super.beforeEach()
        this.hits = []
        this.dbAssert = cloneDeep(databaseAssertUtil)
    }

    @test()
    protected static async canInvokeEveryTestWithOneConnect() {
        assert.isFunction(databaseAssertUtil.runSuite)
    }

    @test()
    protected static async throwsWhenMissingConnect() {
        const err = await assert.doesThrowAsync(() =>
            //@ts-ignore
            databaseAssertUtil.runSuite()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['connect'],
        })
    }

    @test()
    protected static async canSpecifyTests() {
        this.attachHitCounter()

        await this.runTestsAndAssertActuallyRun(['assertCanSortDesc'])
        await this.runTestsAndAssertActuallyRun([
            'assertCanQueryWithOr',
            'assertCanLimitResults',
        ])
    }

    @test()
    protected static async runSuiteHitsAllAssertions() {
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

    @test.skip('wip')
    protected static async canIgnoreTests() {
        this.attachHitCounter()
        const expected = this.pluckTests('assertCanUpdate')

        //@ts-ignore
        await this.runSuite(['!assertCanUpdate'])

        const all = pluckAssertionMethods(this.dbAssert).filter(
            (p) => p !== 'assertHasLowerCaseToCamelCaseMappingEnabled'
        )

        assert.isEqualDeep(expected, all)

        debugger

        this.assertTestsRun(expected)
    }

    private static pluckTests(ignore?: string): DatabaseAssertionName[] {
        return pluckAssertionMethods(this.dbAssert).filter(
            (key) =>
                (!ignore || key !== ignore) &&
                key !== 'assertHasLowerCaseToCamelCaseMappingEnabled'
        ) as DatabaseAssertionName[]
    }

    private static async runTestsAndAssertActuallyRun(
        tests: DatabaseAssertionName[]
    ) {
        await this.runSuite(tests)
        this.assertTestsRun(tests)
        this.hits = []
    }

    private static assertTestsRun(tests: DatabaseAssertionName[]) {
        this.hits.sort()
        tests.sort()

        assert.isEqualDeep(this.hits, tests)
    }

    private static async runSuite(tests?: DatabaseAssertionName[]) {
        await this.dbAssert.runSuite(mongoConnect, tests)
    }

    private static attachHitCounter() {
        const keys = pluckAssertionMethods(this.dbAssert)

        for (const key of keys) {
            //@ts-ignore
            this.dbAssert[key] = async () => {
                this.hits.push(key)
            }
        }
    }
}
