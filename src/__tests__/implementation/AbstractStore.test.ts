import {
    buildSchema,
    dropPrivateFields,
    makeFieldsOptional,
    SchemaValues,
    validationErrorAssert,
} from '@sprucelabs/schema'
import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { SCRAMBLE_VALUE } from '../../constants'
import SpruceError from '../../errors/SpruceError'
import AbstractStore from '../../stores/AbstractStore'
import AbstractDatabaseTest from '../../tests/AbstractDatabaseTest'
import { Database } from '../../types/database.types'
import { PrepareOptions, PrepareResults } from '../../types/stores.types'

export const DEMO_PHONE_FORMATTED = '+1 555-555-5555'
export const DEMO_PHONE2_FORMATTED = '+1 555-555-1234'
export const DEMO_PHONE3_FORMATTED = '+1 555-555-1235'
export const DEMO_PHONE4_FORMATTED = '+1 555-555-1236'

const fullRecordSchema = buildSchema({
    id: 'full-schema',
    name: 'Schema',
    fields: {
        id: {
            type: 'text',
            isRequired: true,
        },
        requiredForCreate: {
            type: 'text',
            isRequired: true,
        },
        requiredForFull: {
            type: 'text',
            isRequired: true,
        },
        requiredForUpdate: {
            type: 'text',
            isRequired: true,
        },
        privateField: {
            type: 'text',
            isPrivate: true,
            isRequired: true,
        },
        phoneNumber: {
            type: 'phone',
            isRequired: true,
        },
        relatedSchema: {
            type: 'schema',
            options: {
                schema: buildSchema({
                    id: 'relatedTestSchema',
                    fields: {
                        textField: { type: 'text' },
                        boolField: { type: 'boolean' },
                    },
                }),
            },
        },
    },
})

const createRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'create-schema',
    fields: {
        ...makeFieldsOptional(fullRecordSchema.fields),
        requiredForCreate: {
            ...fullRecordSchema.fields.requiredForCreate,
        },
        phoneNumber: fullRecordSchema.fields.phoneNumber,
    },
})

const updateRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'update-schema',
    fields: {
        ...makeFieldsOptional(dropPrivateFields(fullRecordSchema.fields)),
        requiredForUpdate: {
            ...fullRecordSchema.fields.requiredForUpdate,
        },
    },
})

const databaseRecordSchema = buildSchema({
    ...fullRecordSchema,
    id: 'database-schema',
    fields: {
        ...fullRecordSchema.fields,
        requiredForDatabase: {
            type: 'boolean',
            isRequired: true,
        },
    },
})

const TEST_COLLECTION_NAME = 'test_collection'

class TestStore extends AbstractStore<
    typeof fullRecordSchema,
    typeof createRecordSchema,
    typeof updateRecordSchema,
    typeof databaseRecordSchema
> {
    public name = 'Test'
    public initialize = undefined

    protected scrambleFields = [
        'requiredForCreate',
        'requiredForFull',
        'requiredForUpdate',
        'privateField',
        'phoneNumber',
    ]
    protected collectionName = TEST_COLLECTION_NAME
    protected fullSchema = fullRecordSchema
    protected createSchema = createRecordSchema
    protected updateSchema = updateRecordSchema
    protected databaseSchema = databaseRecordSchema

    protected willUpdate = undefined
    protected willScramble = undefined

    public static Store(db: Database) {
        return new this(db)
    }

    public setCollectionName(name: string) {
        super.setCollectionName(name)
    }

    protected async willCreate(
        values: SchemaValues<typeof createRecordSchema>
    ) {
        return {
            ...values,
            requiredForCreate:
                values.requiredForCreate ?? 'generate for create',
            requiredForDatabase: true,
            requiredForFull: values.requiredForFull ?? 'generated for full',
            requiredForUpdate:
                values.requiredForUpdate ?? 'generated for update',
            privateField: values.privateField ?? 'generated for privateField',
        }
    }

    protected async prepareRecord<IncludePrivateFields extends boolean>(
        record: SchemaValues<typeof databaseRecordSchema>,
        _options?: PrepareOptions<IncludePrivateFields, typeof fullRecordSchema>
    ) {
        const values: Record<string, any> = {
            ...record,
            requiredForCreate: record.requiredForCreate || 'added here',
            requiredForUpdate: record.requiredForUpdate || 'added there',
            requiredForFull: record.requiredForFull || 'here it is!',
        }

        return values as PrepareResults<
            typeof fullRecordSchema,
            IncludePrivateFields
        >
    }
}

type RelatedSchemaType =
    | {
          textField?: string | null | undefined
          boolField?: boolean | null | undefined
      }
    | null
    | undefined

@suite()
export default class StoreStripsPrivateFieldsTest extends AbstractDatabaseTest {
    private store!: TestStore

    protected async beforeEach() {
        await super.beforeEach()
        await this.connectToDatabase()
        this.store = TestStore.Store(this.db)
    }

    @test()
    protected async canCreateTestStore() {
        assert.isTruthy(this.store)
    }

    @test()
    protected async throwsWhenMissingRequiredOnCreate() {
        const err = (await assert.doesThrowAsync(
            //@ts-ignore
            () => this.store.createOne({})
        )) as SpruceError

        validationErrorAssert.assertError(err, {
            missing: ['requiredForCreate', 'phoneNumber'],
        })
    }

    @test()
    protected async canCreateRecordAndDropPrivate() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        assert.isTruthy(created)
        assert.isTruthy(created.id)
        assert.isEqualDeep(created, {
            id: created.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        assert.isExactType<
            typeof created,
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                phoneNumber: string
            }
        >(true)

        //@ts-ignore
        assert.isFalsy(created.privateField)
    }

    @test()
    protected async canCreateRecordAndKeepPrivateFields() {
        const created = await this.store.createOne(
            {
                requiredForCreate: 'yes!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            },
            { shouldIncludePrivateFields: true }
        )

        assert.isExactType<
            typeof created,
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                privateField: string
                phoneNumber: string
                relatedSchema?: RelatedSchemaType
            }
        >(true)

        assert.isEqualDeep(created, {
            id: created.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            privateField: 'private!',
            phoneNumber: '+1 555-555-5555',
        })
    }

    @test()
    protected async throwsWhenCantFindCreated() {
        const id = this.db.generateId()
        const err = (await assert.doesThrowAsync(() =>
            this.store.updateOne(
                { id },
                {
                    requiredForUpdate: 'for update!',
                }
            )
        )) as SpruceError

        errorAssert.assertError(err, 'RECORD_NOT_FOUND', {
            query: { id },
        })
    }

    @test()
    protected async throwsWhenMissingRequiredOnUpdate() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        const err = (await assert.doesThrowAsync(
            //@ts-ignore
            () => this.store.updateOne({ id: created.id }, {})
        )) as SpruceError

        validationErrorAssert.assertError(err, {
            missing: ['requiredForUpdate'],
        })
    }

    @test()
    protected async updatesSuccessfullyDroppingPrivateFields() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.store.updateOne(
            { id: created.id },
            {
                requiredForUpdate: 'for update!',
            }
        )

        assert.isEqualDeep(updated, {
            id: updated.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'for update!',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isEqual(updated.requiredForCreate, 'yes!')

        assert.isExactType<
            typeof updated,
            {
                id: string
                requiredForCreate: string
                requiredForUpdate: string
                requiredForFull: string
                phoneNumber: string
            }
        >(true)
    }

    @test()
    protected async updatesSuccessfullyKeeepingPrivateFields() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.store.updateOne(
            { id: created.id },
            {
                requiredForUpdate: 'for update!',
            },
            { shouldIncludePrivateFields: true }
        )

        assert.isEqualDeep(updated, {
            id: updated.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'for update!',
            privateField: 'private!',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isEqual(updated.requiredForCreate, 'yes!')

        assert.isExactType<
            typeof updated,
            {
                id: string
                requiredForCreate: string
                requiredForUpdate: string
                requiredForFull: string
                privateField: string
                phoneNumber: string
                relatedSchema?: RelatedSchemaType
            }
        >(true)
    }

    @test()
    protected async canFindOneRecordAndDropPrivateFields() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const match = await this.store.findOne({ id: created.id })

        assert.isTruthy(match)

        assert.isEqualDeep(match, {
            id: match.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isExactType<
            typeof match,
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                phoneNumber: string
            }
        >(true)
    }

    @test()
    protected async canFindOneRecordAndKeepPrivateFields() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const match = await this.store.findOne(
            { id: created.id },
            { shouldIncludePrivateFields: true }
        )

        assert.isTruthy(match)

        assert.isEqualDeep(match, {
            id: created.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            privateField: 'private!',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isExactType<
            typeof match,
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                privateField: string
                phoneNumber: string
                relatedSchema?: RelatedSchemaType
            }
        >(true)
    }

    @test()
    protected async canFindManyRecordAndDropPrivateFields() {
        const created1 = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const created2 = await this.store.createOne({
            requiredForCreate: 'yes2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const matches = await this.store.find({})

        assert.isTruthy(matches)
        assert.isArray(matches)

        assert.isEqualDeep(matches[0], {
            id: created1.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isEqualDeep(matches[1], {
            id: created2.id,
            requiredForCreate: 'yes2!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isExactType<
            (typeof matches)[0],
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                phoneNumber: string
            }
        >(true)

        assert.isExactType<
            (typeof matches)[1],
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                phoneNumber: string
            }
        >(true)
    }

    @test()
    protected async canCreateMany() {
        const values = [
            {
                requiredForCreate: '1 first',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            },
            {
                requiredForCreate: '2 second',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE2_FORMATTED,
            },
            {
                requiredForCreate: '3 third',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE3_FORMATTED,
            },
        ]

        const created = await this.store.create(values, {
            shouldIncludePrivateFields: true,
        })

        assert.isLength(created, values.length)

        for (const v of values) {
            assert.doesInclude(created, v)
        }
    }

    @test()
    protected async whenOneFailsValidationNothingIsWritten() {
        const values = [
            {
                requiredForCreate: 'yes!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            },
            {
                requiredForCreate: 'yes!',
                privateField: 'private!',
                phoneNumber: 'bad phone',
            },
            {
                requiredForCreate: 'yes!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE3_FORMATTED,
            },
        ]

        await assert.doesThrowAsync(() => this.store.create(values))
        const created = await this.store.count({})
        assert.isEqual(created, 0)
    }

    @test(
        'can find many with private fields using old api',
        'findAllWithPrivateOldApi'
    )
    @test(
        'can find many with private fields using new api',
        'findAllWithPrivateNewApi'
    )
    protected async canFindManyRecordAndKeepPrivateFields(
        method: 'findAllWithPrivateOldApi' | 'findAllWithPrivateNewApi'
    ) {
        const created1 = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const created2 = await this.store.createOne({
            requiredForCreate: 'yes2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        const matches = await this[method]()

        assert.isTruthy(matches)
        assert.isArray(matches)

        assert.isEqualDeep(matches[0], {
            id: created1.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            privateField: 'private!',
            phoneNumber: '+1 555-555-5555',
        })

        assert.isEqualDeep(matches[1], {
            id: created2.id,
            requiredForCreate: 'yes2!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            privateField: 'private2!',
            phoneNumber: '+1 555-555-1234',
        })

        assert.isExactType<
            (typeof matches)[0],
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                privateField: string
                phoneNumber: string
                relatedSchema?: RelatedSchemaType
            }
        >(true)

        assert.isExactType<
            (typeof matches)[1],
            {
                id: string
                requiredForCreate: string
                requiredForFull: string
                requiredForUpdate: string
                privateField: string
                phoneNumber: string
                relatedSchema?: RelatedSchemaType
            }
        >(true)
    }

    @test()
    protected async scrambleWithoutScrambleDefinedThrows() {
        //@ts-ignore
        this.store.scrambleFields = null
        const err = (await assert.doesThrowAsync(() =>
            this.store.scramble('taco')
        )) as SpruceError

        errorAssert.assertError(err, 'SCRAMBLE_NOT_CONFIGURED')
    }

    @test()
    protected async canScrambleRecord() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        await this.store.scramble(created.id)

        const match = await this.store.findOne({ id: created.id })

        assert.isTruthy(match)
        assert.isEqual(match.requiredForCreate, SCRAMBLE_VALUE)
        assert.isEqual(match.requiredForFull, SCRAMBLE_VALUE)
        assert.isEqual(match.requiredForUpdate, SCRAMBLE_VALUE)
        assert.isEqual(match.phoneNumber, SCRAMBLE_VALUE)
    }

    @test()
    protected async throwsWhenPassingFieldThatDoesNotExist() {
        const err = (await assert.doesThrowAsync(() =>
            this.store.createOne({
                //@ts-ignore
                cheesyBurrito: 'yum-time',
                requiredForCreate: 'yes!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            })
        )) as SpruceError

        validationErrorAssert.assertError(err, {
            unexpected: ['cheesyBurrito'],
        })
    }

    @test()
    protected async normalizesOnCreate() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED.replace(/[^0-9]/g, ''),
        })

        assert.isEqual(created.phoneNumber, DEMO_PHONE_FORMATTED)

        const match = await this.db.findOne(TEST_COLLECTION_NAME, {})

        //@ts-ignore
        assert.isEqual(match.phoneNumber, DEMO_PHONE_FORMATTED)
    }

    @test()
    protected async normalizesOnUpdate() {
        const created = await this.store.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.store.updateOne(
            { id: created.id },
            {
                phoneNumber: DEMO_PHONE_FORMATTED.replace(/[^0-9]/g, ''),
                requiredForUpdate: 'already set',
            }
        )

        assert.isEqual(updated.phoneNumber, DEMO_PHONE_FORMATTED)

        const match = await this.db.findOne(TEST_COLLECTION_NAME, {})

        //@ts-ignore
        assert.isEqual(match.phoneNumber, DEMO_PHONE_FORMATTED)
    }

    @test()
    protected async upsertCanCreateARecord() {
        const upserted = await this.store.upsertOne(
            { phoneNumber: DEMO_PHONE_FORMATTED },
            {
                requiredForCreate: 'yes!',
                phoneNumber: DEMO_PHONE_FORMATTED,
                requiredForUpdate: 'created',
            }
        )

        assert.isTruthy(upserted)
        assert.isTruthy(upserted.id)
        assert.isEqual(upserted.requiredForUpdate, 'created')

        const match = await this.store.findOne({
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        assert.isTruthy(match)
        assert.isEqual(match.id, upserted.id)
        assert.isEqual(match.requiredForUpdate, 'created')
    }

    @test()
    protected async upsertCanUpdateRecord() {
        const id = this.db.generateId()
        const created = await this.store.upsertOne(
            { id },
            {
                id,
                requiredForUpdate: 'created',
                requiredForCreate: 'created!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            }
        )

        const upserted = await this.store.upsertOne(
            { id: created.id },
            {
                phoneNumber: DEMO_PHONE2_FORMATTED,
                requiredForUpdate: 'required for update',
                requiredForCreate: 'updated',
            }
        )

        assert.isEqual(upserted.phoneNumber, DEMO_PHONE2_FORMATTED)

        const match = await this.store.findOne({
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        assert.isTruthy(match)
        assert.isEqual(upserted.id, match.id)
        assert.isEqual(match.phoneNumber, DEMO_PHONE2_FORMATTED)
        assert.isEqual(match.requiredForUpdate, 'required for update')
    }

    @test()
    protected async canCountRecords() {
        await this.store.createOne({
            requiredForUpdate: 'created',
            requiredForCreate: 'created!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        let count = await this.store.count()
        assert.isEqual(count, 1)

        await this.store.createOne({
            requiredForUpdate: 'created2',
            requiredForCreate: 'created2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        count = await this.store.count()
        assert.isEqual(count, 2)

        await this.store.createOne({
            requiredForUpdate: 'created3',
            requiredForCreate: 'created3!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        count = await this.store.count({ requiredForUpdate: 'created3' })
        assert.isEqual(count, 1)

        count = await this.store.count({ phoneNumber: DEMO_PHONE2_FORMATTED })
        assert.isEqual(count, 0)

        count = await this.store.count({ phoneNumber: DEMO_PHONE_FORMATTED })
        assert.isEqual(count, 3)
    }

    @test()
    protected async canSetAndGetCollectionName() {
        const name = generateId()
        this.store.setCollectionName(name)
        assert.isEqual(this.store.getCollectionName(), name)
    }

    private async findAllWithPrivateOldApi() {
        return await this.store.find(
            {},
            {},
            { shouldIncludePrivateFields: true }
        )
    }

    private async findAllWithPrivateNewApi() {
        return await this.store.find({}, { shouldIncludePrivateFields: true })
    }
}
