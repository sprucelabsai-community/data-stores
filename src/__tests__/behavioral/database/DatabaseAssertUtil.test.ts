import { cloneDeep } from '@sprucelabs/schema'
import { test, assert, errorAssert } from '@sprucelabs/test-utils'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import databaseAssertUtil from '../../../tests/databaseAssertUtil'
import mongoConnect from '../../support/mongoConnect'
import { pluckAssertionMethods } from './pluckAssertionMethods'

export default class DatabaseAssertUtilTest extends AbstractDatabaseTest {
	@test()
	protected static async canInvokeEveryTestWithOneConnect() {
		assert.isFunction(databaseAssertUtil.runSuite)
	}

	@test()
	protected static async throwsWhenMissingConnect() {
		//@ts-ignore
		const err = await assert.doesThrowAsync(() => databaseAssertUtil.runSuite())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['connect'],
		})
	}

	@test()
	protected static async runSuiteHitsAllAssertions() {
		const utilClone = cloneDeep(databaseAssertUtil)
		const keys = pluckAssertionMethods(utilClone)

		let hitCount = 0

		for (const key of keys) {
			//@ts-ignore
			utilClone[key] = async () => {
				hitCount++
			}
		}

		await utilClone.runSuite(mongoConnect)

		assert.isEqual(hitCount, keys.length)
	}
}
