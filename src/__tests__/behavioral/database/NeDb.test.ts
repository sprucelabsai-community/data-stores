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

    @test()
    protected async createHonorsUniqueIndexes() {
        await this.syncUniqueIndexes()

        await this.createPerson({
            phone: 'phone1',
            email: undefined,
        })
        await this.createPerson({
            phone: 'phone2',
            email: undefined,
        })
        await this.createPerson({
            phone: 'phone3',
        })
        await this.createPerson({
            phone: 'phone4',
            email: undefined,
        })

        await this.assertThrowsDuplicate({ phone: 'phone1' })
        await this.assertThrowsDuplicate({ phone: 'phone2' })
        await this.assertThrowsDuplicate({ phone: 'phone3', email: null })
        await this.assertThrowsDuplicate({ phone: 'phone4' })
    }

    @test()
    protected async upsertHonorsUniqueIndexes() {
        await this.syncUniqueIndexes()

        await this.client.upsertOne(
            this.collectionName,
            { phone: 'phone2', email: null },
            { phone: 'phone2', email: null, dateScrambled: undefined }
        )

        await this.client.upsertOne(
            this.collectionName,
            { phone: 'phone1', email: null },
            { phone: 'phone1', email: null }
        )

        await this.client.upsertOne(
            this.collectionName,
            { phone: 'phone2', email: null },
            { phone: 'phone2', email: null }
        )

        await this.client.upsertOne(
            this.collectionName,
            { phone: 'phone1', email: null },
            { phone: 'phone1', email: null }
        )

        await this.client.upsertOne(
            this.collectionName,
            { phone: 'phone2', email: null },
            { phone: 'phone2', email: null }
        )
    }

    private async syncUniqueIndexes() {
        await this.client.syncUniqueIndexes(this.collectionName, [
            {
                fields: ['phone', 'dateScrambled'],
                filter: { phone: { $type: 'string' } },
            },
            {
                fields: ['username', 'dateScrambled'],
                filter: { username: { $type: 'string' } },
            },
            {
                fields: ['email', 'dateScrambled'],
                filter: { email: { $type: 'string' } },
            },
        ])
    }

    private async assertThrowsDuplicate(overrides: Person) {
        await assert.doesThrowAsync(() => this.createPerson(overrides))
    }

    private async createPerson(overrides: Person) {
        await this.client.createOne(
            this.collectionName,
            this.generatePersonValues(overrides)
        )
    }

    private generatePersonValues(overrides?: Person) {
        return {
            phone: null,
            dateScrambled: null,
            username: null,
            email: null,
            ...overrides,
        }
    }

    private assertQueryFromFilterEquals(
        filter: Record<string, any>,
        expected: Record<string, any>
    ) {
        const actual = mapIndexFilterToNeDbQuery(filter)
        assert.isEqualDeep(actual, expected)
    }

    private async createOne(values?: Record<string, any>) {
        return await this.client.createOne(
            this.collectionName,
            {
                first: generateId(),
                ...values,
            },
            {
                primaryFieldNames: ['personid'],
            }
        )
    }
}

interface Person {
    phone?: string | null
    dateScrambled?: string | null
    username?: string | null
    email?: string | null
}
