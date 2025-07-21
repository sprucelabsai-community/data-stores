import AbstractSpruceTest, { test, suite, assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { ObjectId } from 'mongodb'
import SpruceError from '../../errors/SpruceError'
import mongoUtil from '../../utilities/mongo.utility'

const id1 = new ObjectId()
const id2 = new ObjectId()

@suite()
export default class MappingMongoIdsTest extends AbstractSpruceTest {
    @test()
    protected async mapsSimpleQuery() {
        const id = new ObjectId()
        const results = mongoUtil.mapQuery({ id: id.toHexString() })
        assert.isEqualDeep(results, { _id: id })
    }

    @test(
        'maps query with $in at top level',
        {
            id: { $in: [id1.toHexString(), id2.toHexString()] },
        },
        {
            _id: { $in: [id1, id2] },
        }
    )
    @test(
        'maps query with $in and $and at top level',
        {
            id: {
                $in: [id1.toHexString(), id2.toHexString()],
                $and: [id1.toHexString()],
            },
        },
        {
            _id: { $in: [id1, id2], $and: [id1] },
        }
    )
    @test(
        'maps query with $and at top level and $in under that',
        {
            id: {
                $or: [{ $nor: [id1.toHexString()] }, id2.toHexString()],
            },
        },
        {
            _id: { $or: [{ $nor: [id1] }, id2] },
        }
    )
    @test(
        'maps query with $or top level ',
        {
            $or: [
                {
                    id: id1.toHexString(),
                },
                {
                    isPublic: true,
                },
            ],
        },
        {
            $or: [{ _id: id1 }, { isPublic: true }],
        }
    )
    @test(
        'maps query with $or top level and $in lower level',
        {
            $or: [
                {
                    id: { $in: [id1.toHexString(), id2.toHexString()] },
                },
                {
                    isPublic: true,
                },
            ],
        },
        {
            $or: [{ _id: { $in: [id1, id2] } }, { isPublic: true }],
        }
    )
    @test(
        'maps query with $and top level and $in lower level',
        {
            $and: [
                {
                    id: { $in: [id1.toHexString(), id2.toHexString()] },
                },
                {
                    isPublic: true,
                },
            ],
        },
        {
            $and: [{ _id: { $in: [id1, id2] } }, { isPublic: true }],
        }
    )
    @test(
        'maps query with $and top level and $gt lower level',
        {
            $and: [
                {
                    id: { $gt: id1.toHexString() },
                },
                {
                    isPublic: true,
                },
            ],
        },
        {
            $and: [{ _id: { $gt: id1 } }, { isPublic: true }],
        }
    )
    @test(
        'maps query with $id with $gt top leven',
        {
            id: { $lt: id1.toHexString() },
        },
        {
            _id: { $lt: id1 },
        }
    )
    @test(
        'maps query with $and and $or with $gt nested in $o0',
        {
            $and: [
                {
                    $or: [
                        { firstName: { $lte: 'Record 1' } },
                        {
                            firstName: { $gt: 'Record 1' },
                            id: { $gt: id1.toHexString() },
                        },
                    ],
                },
                {},
            ],
        },
        {
            $and: [
                {
                    $or: [
                        { firstName: { $lte: 'Record 1' } },
                        {
                            firstName: { $gt: 'Record 1' },
                            _id: { $gt: id1 },
                        },
                    ],
                },
                {},
            ],
        }
    )
    @test(`Doesn't bomb with undefined`, undefined, {})
    protected async mapsAsExpected(
        query: Record<string, any>,
        expected: Record<string, any>
    ) {
        const results = mongoUtil.mapQuery(query)
        assert.isEqualDeep(results, expected)
    }

    @test(
        `Throws with id undefined`,
        { id: undefined },
        'MONGO_ID_MAPPING_ERROR'
    )
    @test(
        `Throws with id $in undefined`,
        { id: { $in: undefined } },
        'MONGO_ID_MAPPING_ERROR'
    )
    protected async throwsAsExpected(query: any, expectedCode: string) {
        const err = assert.doesThrow(() =>
            mongoUtil.mapQuery(query)
        ) as SpruceError
        errorAssert.assertError(err, expectedCode)
    }

    @test()
    protected async doesNotDestroyRegex() {
        const results = mongoUtil.mapQuery({
            name: { $regex: /hey/ },
        })

        assert.isTrue(results.name.$regex instanceof RegExp)
    }
}
