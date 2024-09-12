import { cloneDeep } from '@sprucelabs/schema'
import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil, {
    DatabaseAssertionName,
} from '../../../tests/databaseAssertUtil'
import pluckAssertionMethods from '../../../tests/pluckAssertionMethods'
import mongoConnect from '../../support/mongoConnect'

export default class DatabaseAssertUtilTest extends AbstractDatabaseTest {
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
        const utilClone = cloneDeep(databaseAssertUtil)
        const keys = pluckAssertionMethods(utilClone)

        let hits: string[] = []

        for (const key of keys) {
            //@ts-ignore
            utilClone[key] = async () => {
                hits.push(key)
            }
        }

        let tests: DatabaseAssertionName[] = ['assertCanSortDesc']
        await utilClone.runSuite(mongoConnect, tests)
        assert.isEqualDeep(hits, tests)

        hits = []
        tests = ['assertCanQueryWithOr', 'assertCanLimitResults']
        await utilClone.runSuite(mongoConnect, tests)
        assert.isEqualDeep(hits, tests)
    }

    @test()
    protected static async runSuiteHitsAllAssertions() {
        const utilClone = cloneDeep(databaseAssertUtil)
        const keys = pluckAssertionMethods(utilClone)

        const hits: Record<string, boolean> = {}
        const expected: Record<string, boolean> = {}

        for (const key of keys) {
            if (key !== 'assertHasLowerCaseToCamelCaseMappingEnabled') {
                expected[key] = true
                //@ts-ignore
                utilClone[key] = () => {
                    hits[key] = true
                }
            }
        }

        await utilClone.runSuite(mongoConnect)

        assert.isEqualDeep(hits, expected)
    }
}
