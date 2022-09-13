import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import { ObjectId } from 'mongodb'
import generateId from '../../utilities/generateId'

export default class GeneratingIdsTest extends AbstractSpruceTest {
	@test()
	protected static hasGenerateId() {
		assert.isFunction(generateId)
	}

	@test()
	protected static generatesAString() {
		const value = generateId()
		assert.isString(value)
	}

	@test()
	protected static generatesAnId() {
		const value = generateId()
		new ObjectId(value)
	}
}
