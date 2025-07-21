import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import mapIndexFilterToNeDbQuery from '../../../databases/mapIndexFilterToNeDbQuery'
import NeDbDatabase from '../../../databases/NeDbDatabase'
import AbstractDatabaseTest from '../../../tests/AbstractDatabaseTest'
import neDbConnect from '../../support/neDbConnect'

@suite()
export default class NeDbTest extends AbstractDatabaseTest {
    private client!: NeDbDatabase

    private readonly collectionName = 'people'

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        const { db } = await neDbConnect()
        this.client = db
    }

    @test()
    protected async doesNotAddIdFieldWithDifferentPrimaryField() {
        const created = await this.createOne()
        assert.isFalsy(created.id)
    }

    @test()
    protected async doesNotAddInIdFieldOnFindWithDifferentPrimaryField() {
        const created = await this.createOne()
        const found = await this.client.findOne(
            this.collectionName,
            {
                first: created.first,
            },
            {},
            {
                primaryFieldNames: ['personid'],
            }
        )
        assert.isTruthy(found)
        assert.isFalsy(found.id)
    }

    @test()
    protected async doesNotAddInIdFieldWithManyResults() {
        await this.createOne()
        await this.createOne()

        const all = await this.client.find(
            this.collectionName,
            {},
            {},
            {
                primaryFieldNames: ['personid'],
            }
        )
        assert.isLength(all, 2)
        assert.isFalsy(all[0].id)
        assert.isFalsy(all[1].id)
    }

    @test()
    protected async mapsIndexFiltersToQuery() {
        this.assertQueryFromFilterEquals(
            {
                firstName: 'test',
            },
            {
                firstName: 'test',
            }
        )

        this.assertQueryFromFilterEquals(
            {
                username: { $type: 'string' },
            },
            {
                username: { $ne: null },
            }
        )

        this.assertQueryFromFilterEquals(
            {
                firstName: { $exists: true },
            },
            {
                firstName: { $exists: true },
            }
        )
    }

    private assertQueryFromFilterEquals(
        filter: Record<string, any>,
        expected: Record<string, any>
    ) {
        const actual = mapIndexFilterToNeDbQuery(filter)
        assert.isEqualDeep(actual, expected)
    }

    private async createOne(first?: string) {
        return await this.client.createOne(
            this.collectionName,
            {
                first: first ?? generateId(),
            },
            {
                primaryFieldNames: ['personid'],
            }
        )
    }
}
