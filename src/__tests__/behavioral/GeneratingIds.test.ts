import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import { ObjectId } from 'mongodb'
import generateId from '../../utilities/generateId'

@suite()
export default class GeneratingIdsTest extends AbstractSpruceTest {
    @test()
    protected hasGenerateId() {
        assert.isFunction(generateId)
    }

    @test()
    protected generatesAString() {
        const value = generateId()
        assert.isString(value)
    }

    @test()
    protected generatesAnId() {
        const value = generateId()
        new ObjectId(value)
    }
}
