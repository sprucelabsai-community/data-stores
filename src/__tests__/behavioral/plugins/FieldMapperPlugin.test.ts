import { buildSchema } from '@sprucelabs/schema'
import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import DatabaseFieldMapperPlugin from '../../../plugins/DatabaseFieldMapperPlugin'
import { QuerySortField } from '../../../types/query.types'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'

@suite()
export default class FieldMapperPluginTest extends AbstractStoreTest {
    private plugin!: DatabaseFieldMapperPlugin
    protected async beforeEach() {
        await super.beforeEach()
        this.setupMapperPlugin({
            firstName: 'first',
            lastName: 'last',
            id: 'personid',
        })

        this.spyStore.setFullSchema(personSchemaFull)
        this.spyStore.setDatabaseSchema(personSchemaDatabase)
        this.spyStore.setPrimaryFieldNames(['personid'])
    }

    @test()
    protected async pluginHasExpectedName() {
        assert.isEqual(this.plugin.getName(), 'fieldMapper')
    }

    @test()
    protected async canMapFieldsOnCreate() {
        const firstName = generateId()
        const lastName = generateId()

        const values = {
            firstName,
            lastName,
        }
        const { actual, created } = await this.createOneAndFind(values)

        assert.isEqualDeep(actual, {
            first: firstName,
            last: lastName,
            personid: created.id,
        })
    }

    @test()
    protected async canMapDifferentFieldsOnCreate() {
        this.setupMapperPlugin({
            id: 'carid',
            color: 'carcolor',
            make: 'carmake',
        })
        this.spyStore.setFullSchema(carSchemaFull)
        this.spyStore.setDatabaseSchema(carSchemaDatabase)
        this.spyStore.setCreateSchema(carSchemaFull)
        this.spyStore.setPrimaryFieldNames(['carid'])

        const { actual, created } = await this.createOneAndFind({
            color: 'red',
            make: 'ford',
        })

        assert.isEqualDeep(actual, {
            carcolor: 'red',
            carmake: 'ford',
            carid: created.id,
        })
    }

    @test()
    protected async canMapFieldsInQuery() {
        const firstName1 = 'Tay'
        const lastName1 = 'Jay'

        const firstName2 = 'Eric'
        const lastName2 = 'Jay'

        await this.createOne({
            firstName: firstName1,
            lastName: lastName1,
        })

        await this.createOne({
            firstName: firstName2,
            lastName: lastName2,
        })

        await this.assertSearchByFirstNameMatches(firstName1)
        await this.assertSearchByFirstNameMatches(firstName2)
        await this.assertSearchByLastNameMatches(lastName1)
        await this.assertSearchByLastNameMatches(lastName2)
    }

    @test()
    protected async canMapFieldsInSort() {
        await this.createOne({
            firstName: 'Tay',
            lastName: 'Jay',
        })

        await this.createOne({
            firstName: 'Eric',
            lastName: 'Jay',
        })

        await this.assertFirstResultFirstNameEquals(
            [
                {
                    field: 'firstName',
                    direction: 'desc',
                },
            ],
            'Tay'
        )

        await this.assertFirstResultFirstNameEquals(
            [
                {
                    field: 'firstName',
                    direction: 'asc',
                },
            ],
            'Eric'
        )
    }

    @test()
    protected async doesNotClobberExistingQueryOptions() {
        await this.createOneRandom()
        await this.createOneRandom()
        await this.createOneRandom()

        await this.assertFindHonorsLimit(1)
        await this.assertFindHonorsLimit(2)
    }

    @test()
    protected async canMapUpdates() {
        const first = await this.createOneRandom()
        const firstName = generateId()
        const lastName = generateId()

        await this.spyStore.updateOne(
            {
                id: first.id!,
            },
            {
                firstName,
                lastName,
            }
        )

        await this.assertSearchByFieldMatches('firstName', firstName)
        await this.assertSearchByFieldMatches('lastName', lastName)
    }

    @test()
    protected async databaseReturningMoreFieldsThanExpectedDoesntCrash() {
        const expected = {
            firstName: generateId(),
            lastName: generateId(),
        }

        const extra = generateId()

        this.db.createOne = async (_, values) => {
            return {
                ...values,
                extra,
            }
        }

        await this.spyStore.createOne(expected)
    }

    @test()
    protected async canMapFieldsWhenUpdatingMany() {
        await this.createOneRandom()
        await this.createOneRandom()

        const expected = generateId()
        await this.spyStore.update(
            {},
            {
                firstName: expected,
            }
        )

        const [firstMatch, secondMatch] = await this.spyStore.find({})

        assert.isEqual(
            firstMatch.firstName,
            expected,
            'Did not update first match'
        )

        assert.isEqual(
            secondMatch.firstName,
            expected,
            'Did not update second match'
        )
    }

    @test()
    protected async canUpdateManyWithQuery() {
        const created = await this.createOneRandom()

        const firstName = generateId()
        const count = await this.spyStore.update(
            {
                firstName: created.firstName,
            },
            {
                firstName,
            }
        )

        assert.isEqual(count, 1)

        const found = await this.spyStore.findOne({ firstName })
        assert.isTruthy(found)
        assert.isEqual(found?.firstName, firstName, 'Did not update first name')
    }

    private async assertFindHonorsLimit(limit: number) {
        const matches = await this.spyStore.find({}, { limit })
        assert.isLength(matches, limit)
    }

    private async createOneRandom() {
        return await this.createOne({
            firstName: generateId(),
            lastName: generateId(),
        })
    }

    private async assertFirstResultFirstNameEquals(
        sort: QuerySortField[],
        expected: string
    ) {
        const [first] = await this.spyStore.find(
            {},
            {
                sort,
            }
        )

        assert.isEqual(first?.firstName, expected)
    }

    private async assertSearchByLastNameMatches(search: string) {
        await this.assertSearchByFieldMatches('lastName', search)
    }

    private async assertSearchByFirstNameMatches(search: string) {
        await this.assertSearchByFieldMatches('firstName', search)
    }

    private async assertSearchByFieldMatches(field: string, search: string) {
        const match = await this.spyStore.findOne({
            [field]: search,
        })

        assert.isTruthy(match)
        //@ts-ignore
        assert.isEqual(match?.[field], search)
    }

    private setupMapperPlugin(map: Record<string, any>) {
        this.plugin = new DatabaseFieldMapperPlugin(map)
        this.spyStore.clearPlugins()
        this.spyStore.addPlugin(this.plugin)
    }

    private async createOneAndFind(values: Record<string, any>) {
        const created = await this.createOne(values)
        const actual = await this.db.findOne(
            this.spyStore.getCollectionName(),
            {}
        )

        //@ts-ignore NeDB adds this id field no matter what (store removes it)
        delete actual.id
        return { actual, created }
    }

    private async createOne(values: Record<string, any>) {
        return await this.spyStore.createOne(values)
    }
}

const personSchemaFull = buildSchema({
    id: 'fullPerson',
    fields: {
        id: {
            type: 'id',
            isRequired: true,
        },
        firstName: {
            type: 'text',
            isRequired: true,
        },
        lastName: {
            type: 'text',
            isRequire: true,
        },
    },
})

const personSchemaDatabase = buildSchema({
    id: 'databasePerson',
    fields: {
        personid: {
            type: 'id',
            isRequired: true,
        },
        first: {
            type: 'text',
            isRequired: true,
        },
        last: {
            type: 'text',
            isRequire: true,
        },
    },
})

const carSchemaFull = buildSchema({
    id: 'fullCar',
    fields: {
        id: {
            type: 'id',
        },
        color: {
            type: 'text',
            isRequired: true,
        },
        make: {
            type: 'text',
            isRequire: true,
        },
    },
})

const carSchemaDatabase = buildSchema({
    id: 'databaseCar',
    fields: {
        carid: {
            type: 'id',
            isRequired: true,
        },
        carcolor: {
            type: 'text',
            isRequired: true,
        },
        carmake: {
            type: 'text',
            isRequire: true,
        },
    },
})
