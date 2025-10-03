import { validationErrorAssert } from '@sprucelabs/schema'
import { test, suite, assert } from '@sprucelabs/test-utils'
import { errorAssert, generateId } from '@sprucelabs/test-utils'
import { SCRAMBLE_VALUE } from '../../../constants'
import SpruceError from '../../../errors/SpruceError'
import AbstractStoreTest from './support/AbstractStoreTest'
import DummyStore, { TEST_COLLECTION_NAME } from './support/DummyStore'

@suite()
export default class UsingStoresTest extends AbstractStoreTest {
    @test()
    protected async canCreateTestStore() {
        assert.isTruthy(this.dummyStore)
    }

    @test()
    protected async throwsWhenMissingRequiredOnCreate() {
        const err = (await assert.doesThrowAsync(
            //@ts-ignore
            () => this.dummyStore.createOne({})
        )) as SpruceError

        validationErrorAssert.assertError(err, {
            missing: ['requiredForCreate', 'phoneNumber'],
        })
    }

    @test()
    protected async canCreateRecordAndDropPrivate() {
        const created = await this.dummyStore.createOne({
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
        const created = await this.dummyStore.createOne(
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
            this.dummyStore.updateOne(
                { id },
                {
                    requiredForUpdate: 'hey',
                }
            )
        )) as SpruceError

        errorAssert.assertError(err, 'RECORD_NOT_FOUND', {
            query: { id },
        })
    }

    @test()
    protected async throwsWhenMissingRequiredOnUpdate() {
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        const err = (await assert.doesThrowAsync(
            //@ts-ignore
            () => this.dummyStore.updateOne({ id: created.id }, {})
        )) as SpruceError

        validationErrorAssert.assertError(err, {
            missing: ['requiredForUpdate'],
        })
    }

    @test()
    protected async updatesSuccessfullyDroppingPrivateFields() {
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.dummyStore.updateOne(
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
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.dummyStore.updateOne(
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
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const match = await this.dummyStore.findOne({ id: created.id })
        assert.isTruthy(match)

        assert.isEqualDeep(match, {
            id: match.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: '+1 555-555-5555',
        })

        //@ts-ignore
        const rawMatch = await this.dummyStore.findOneRaw({ _id: created.id })

        assert.isEqualDeep(rawMatch, {
            id: match.id,
            requiredForCreate: 'yes!',
            requiredForFull: 'generated for full',
            requiredForUpdate: 'generated for update',
            phoneNumber: '+1 555-555-5555',
            privateField: 'private!',
            requiredForDatabase: true,
            relatedSchema: null,
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
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const match = await this.dummyStore.findOne(
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
        const created1 = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const created2 = await this.dummyStore.createOne({
            requiredForCreate: 'yes2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const matches = await this.dummyStore.find({})

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

        const created = await this.dummyStore.create(values, {
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

        await assert.doesThrowAsync(() => this.dummyStore.create(values))
        const created = await this.dummyStore.count({})
        assert.isEqual(created, 0)
    }

    @test()
    protected async canFindManyRecordAndKeepPrivateFields() {
        const created1 = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const created2 = await this.dummyStore.createOne({
            requiredForCreate: 'yes2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        const matches = await this.dummyStore.find(
            {},
            { shouldIncludePrivateFields: true }
        )

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
        this.dummyStore.scrambleFields = null
        const err = (await assert.doesThrowAsync(() =>
            this.dummyStore.scramble('taco')
        )) as SpruceError

        errorAssert.assertError(err, 'SCRAMBLE_NOT_CONFIGURED')
    }

    @test()
    protected async canScrambleRecord() {
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        await this.dummyStore.scramble(created.id)

        const match = await this.dummyStore.findOne({ id: created.id })

        assert.isTruthy(match)
        assert.isEqual(match.requiredForCreate, SCRAMBLE_VALUE)
        assert.isEqual(match.requiredForFull, SCRAMBLE_VALUE)
        assert.isEqual(match.requiredForUpdate, SCRAMBLE_VALUE)
        assert.isEqual(match.phoneNumber, SCRAMBLE_VALUE)
    }

    @test()
    protected async throwsWhenPassingFieldThatDoesNotExist() {
        const err = (await assert.doesThrowAsync(() =>
            this.dummyStore.createOne({
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
        const created = await this.dummyStore.createOne({
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
        const created = await this.dummyStore.createOne({
            requiredForCreate: 'yes!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const updated = await this.dummyStore.updateOne(
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
        const upserted = await this.dummyStore.upsertOne(
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

        const match = await this.dummyStore.findOne({
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        assert.isTruthy(match)
        assert.isEqual(match.id, upserted.id)
        assert.isEqual(match.requiredForUpdate, 'created')
    }

    @test()
    protected async upsertCanUpdateRecord() {
        const id = this.db.generateId()
        const created = await this.dummyStore.upsertOne(
            { id },
            {
                id,
                requiredForUpdate: 'created',
                requiredForCreate: 'created!',
                privateField: 'private!',
                phoneNumber: DEMO_PHONE_FORMATTED,
            }
        )

        const upserted = await this.dummyStore.upsertOne(
            { id: created.id },
            {
                phoneNumber: DEMO_PHONE2_FORMATTED,
                requiredForUpdate: 'required for update',
                requiredForCreate: 'updated',
            }
        )

        assert.isEqual(upserted.phoneNumber, DEMO_PHONE2_FORMATTED)

        const match = await this.dummyStore.findOne({
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })

        assert.isTruthy(match)
        assert.isEqual(upserted.id, match.id)
        assert.isEqual(match.phoneNumber, DEMO_PHONE2_FORMATTED)
        assert.isEqual(match.requiredForUpdate, 'required for update')
    }

    @test()
    protected async canCountRecords() {
        await this.dummyStore.createOne({
            requiredForUpdate: 'created',
            requiredForCreate: 'created!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        let count = await this.dummyStore.count()
        assert.isEqual(count, 1)

        await this.dummyStore.createOne({
            requiredForUpdate: 'created2',
            requiredForCreate: 'created2!',
            privateField: 'private2!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        count = await this.dummyStore.count()
        assert.isEqual(count, 2)

        await this.dummyStore.createOne({
            requiredForUpdate: 'created3',
            requiredForCreate: 'created3!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        count = await this.dummyStore.count({ requiredForUpdate: 'created3' })
        assert.isEqual(count, 1)

        count = await this.dummyStore.count({
            phoneNumber: DEMO_PHONE2_FORMATTED,
        })
        assert.isEqual(count, 0)

        count = await this.dummyStore.count({
            phoneNumber: DEMO_PHONE_FORMATTED,
        })
        assert.isEqual(count, 3)
    }

    @test()
    protected async willUpdatePassesOriginalValues() {
        const created = await this.dummyStore.createOne({
            requiredForUpdate: 'created',
            requiredForCreate: 'created!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        await this.dummyStore.updateOne(
            { id: created.id },
            { requiredForUpdate: 'yes!' }
        )

        assert.isTruthy(this.dummyStore.willUpdateValues)
        assert.isTruthy(this.dummyStore.willUpdateUpdates)
        assert.isEqualDeep(this.dummyStore.willUpdateUpdates, {
            requiredForUpdate: 'yes!',
        })

        assert.isEqualDeep(this.dummyStore.willUpdateValues, {
            ...created,
            privateField: 'private!',
        })
    }

    @test()
    protected async canGetBackSelectedFields() {
        await this.dummyStore.createOne({
            requiredForUpdate: 'created',
            requiredForCreate: 'created!',
            privateField: 'private!',
            phoneNumber: DEMO_PHONE_FORMATTED,
        })

        const match = await this.dummyStore.findOne(
            {},
            { includeFields: ['requiredForUpdate'] }
        )

        assert.isEqualDeep(match, {
            requiredForUpdate: 'created',
        })

        const matches = await this.dummyStore.find(
            {},
            {
                includeFields: ['id', 'phoneNumber', 'privateField'],
                shouldIncludePrivateFields: true,
            }
        )

        assert.isEqualDeep(matches[0], {
            id: matches[0].id,
            phoneNumber: DEMO_PHONE_FORMATTED,
            privateField: 'private!',
        })
    }

    @test()
    protected async triggersDidCreateAfterCreating() {
        const expected = await this.createRandomRecord()

        delete this.dummyStore.didCreateValues.relatedSchema
        assert.isEqualDeep(this.dummyStore.didCreateValues, {
            ...expected,
        })
    }

    @test()
    protected async triggersDidUpdateAfterUpdating() {
        const created = await this.createRandomRecord()
        const updates = {
            phoneNumber: '+1 555-000-1111',
            requiredForCreate: generateId(),
            requiredForFull: generateId(),
            requiredForUpdate: generateId(),
            relatedSchema: {
                boolField: true,
                textField: 'text',
            },
        }

        await this.dummyStore.updateOne({}, updates)

        //@ts-ignore
        delete created.requiredForDatabase

        assert.isEqualDeep(this.dummyStore.didUpdateValues?.old, created)
        assert.isEqualDeep(this.dummyStore.didUpdateValues?.updated, {
            ...created,
            ...updates,
            requiredForDatabase: true,
        })
    }

    @test()
    protected async getStoreGetsSameInstance() {
        const d1 = await this.stores.getStore('dummy')
        assert.isTrue(d1 instanceof DummyStore)
        const d2 = await this.stores.getStore('dummy')
        assert.isEqual(d1, d2)
        const o1 = await this.stores.getStore('operations')
        assert.isNotEqual(d1, o1 as any)
    }

    @test()
    protected async canSetStore() {
        await this.stores.getStore('dummy')
        const d2 = await this.stores.Store('dummy')
        this.stores.setStore('dummy', d2)
        const d3 = await this.stores.getStore('dummy')
        assert.isEqual(d2, d3)
    }

    @test()
    protected async byDefaultStripsUndefinedAndNullValuesWhenLoading() {
        const dummy = await this.operationsStore.createOne({
            arrayOfNumbers: [1, 2, 3],
        })

        const match = await this.operationsStore.findOne({
            id: dummy.id,
        })

        assert.isEqualDeep(match, {
            arrayOfNumbers: [1, 2, 3],
            id: dummy.id,
        })

        const all = await this.operationsStore.find({
            id: dummy.id,
        })

        assert.isEqualDeep(all[0], {
            arrayOfNumbers: [1, 2, 3],
            id: dummy.id,
        })
    }

    @test()
    protected async canDisableStrippingUndefinedAndNullValuesWhenLoading() {
        const dummy = await this.operationsStore.createOne({
            arrayOfNumbers: [1, 2, 3],
        })

        const match = await this.operationsStore.findOne(
            {
                id: dummy.id,
            },
            {
                shouldStripUndefinedAndNullValues: false,
            }
        )

        assert.isEqualDeep(match, {
            arrayOfNumbers: [1, 2, 3],
            id: dummy.id,
            score: null,
            arrayOfStrings: null,
        })

        const all = await this.operationsStore.find(
            {
                id: dummy.id,
            },
            {
                shouldStripUndefinedAndNullValues: false,
            }
        )

        assert.isEqualDeep(all[0], {
            arrayOfNumbers: [1, 2, 3],
            id: dummy.id,
            score: null,
            arrayOfStrings: null,
        })
    }

    @test()
    protected async canExcludeFields() {
        const operation = await this.operationsStore.createOne({
            arrayOfNumbers: [1, 2, 3],
            arrayOfStrings: ['a', 'b', 'c'],
        })

        const match = await this.operationsStore.findOne(
            {
                id: operation.id,
            },
            {
                excludeFields: ['arrayOfNumbers'],
            }
        )

        delete operation.arrayOfNumbers

        assert.isEqualDeep(match, operation, 'Did not exclude fields')
    }

    @test()
    protected async canUpdateTargetedFieldWhileRetainingOtherValues() {
        await this.createRandomRecordWithRelatedSchema()

        const newTextFieldValue = generateId()

        const results = await this.dummyStore.updateOne(
            {},
            {
                requiredForUpdate: generateId(),
                'relatedSchema.textField': newTextFieldValue,
            }
        )

        assert.isEqualDeep(results.relatedSchema, {
            textField: newTextFieldValue,
            boolField: true,
        })
    }

    @test()
    protected async canUpdateOneManyDotNotation() {
        const created = await this.createRandomRecordWithRelatedSchema()

        await this.dummyStore.update(
            {},
            {
                requiredForUpdate: generateId(),
                'relatedSchema.boolField': false,
            }
        )

        const match = await this.findOne()

        assert.isEqualDeep(match.relatedSchema, {
            boolField: false,
            textField: created.relatedSchema?.textField,
        })
    }

    @test()
    protected async canUpdateManyUsingDotNotationQuery() {
        const created = await this.createRandomRecordWithRelatedSchema()

        const updateValue = generateId()
        const textValue = created.relatedSchema?.textField

        let count = await this.dummyStore.update(
            {
                'relatedSchema.textField': textValue,
            },
            {
                requiredForUpdate: updateValue,
                'relatedSchema.boolField': false,
            }
        )

        assert.isEqual(count, 1, 'first update should have updated 1 record')

        count = await this.dummyStore.update(
            {
                'relatedSchema.textField': textValue,
            },
            {
                requiredForUpdate: updateValue,
                'relatedSchema.boolField': false,
            }
        )

        assert.isEqual(
            count,
            1,
            'second update should have matched 1 record, but not updated'
        )

        const totalRecords = await this.dummyStore.count()
        assert.isEqual(totalRecords, 1)
    }

    @test()
    protected async settingDatabaseForStoreClearsCachedStoreInstance() {
        const store = await this.stores.getStore('dummy')
        this.stores.setDatabaseForStore('dummy', this.db)
        const newStore = await this.stores.getStore('dummy')
        assert.isNotEqual(store, newStore)
    }

    @test()
    protected async settingDatabaseForStoreDoesNotClearOtherStoreInstances() {
        const store = await this.stores.getStore('operations')
        this.stores.setDatabaseForStore('dummy', this.db)
        const newStore = await this.stores.getStore('operations')
        assert.isEqual(store, newStore)
    }

    @test()
    protected async setStoreClassClearsCachedStoreInstance() {
        const store = await this.stores.getStore('dummy')
        this.stores.setStoreClass('dummy', DummySubClass)
        const newStore = await this.stores.getStore('dummy')
        assert.isNotEqual(store, newStore)
    }

    @test()
    protected async setStoreClassDoesNotClearOtherStoreInstances() {
        const store = await this.stores.getStore('operations')
        this.stores.setStoreClass('dummy', DummySubClass)
        const newStore = await this.stores.getStore('operations')
        assert.isEqual(store, newStore)
    }

    @test()
    protected async upsertShouldNotReturnPrivateFieldsByDefault() {
        const created = await this.dummyStore.upsertOne(
            {},
            {
                requiredForCreate: 'yes!',
                privateField: 'private!',
                requiredForUpdate: 'updated',
                phoneNumber: DEMO_PHONE_FORMATTED,
            }
        )

        assert.isFalsy(
            created.privateField,
            'should not have returned private fields'
        )
    }

    @test()
    protected async upsertCanReturnPrivateFields() {
        const privateValue = generateId()
        const created = await this.dummyStore.upsertOne(
            {},
            {
                requiredForCreate: 'yes!',
                privateField: privateValue,
                requiredForUpdate: 'updated',
                phoneNumber: DEMO_PHONE_FORMATTED,
            },
            { shouldIncludePrivateFields: true }
        )

        assert.isEqual(
            created.privateField,
            privateValue,
            'private field should have been returned'
        )
    }

    @test.only()
    protected async searchingWithOrWhenIdInOneCaseIsBadStillWorks() {
        await this.dummyStore.createOne({
            phoneNumber: DEMO_PHONE_FORMATTED,
            requiredForCreate: 'required-one',
        })

        await this.dummyStore.createOne({
            phoneNumber: DEMO_PHONE2_FORMATTED,
            requiredForCreate: 'required-two',
        })

        const match = await this.dummyStore.find({
            $or: [{ id: 'bad-id' }, { phoneNumber: DEMO_PHONE2_FORMATTED }],
        })

        assert.isTruthy(
            match[0],
            'should have found match with $or even though the id was bad'
        )
    }

    private async createRandomRecordWithRelatedSchema() {
        return await this.dummyStore.createOne({
            phoneNumber: DEMO_PHONE4_FORMATTED,
            requiredForCreate: generateId(),
            relatedSchema: {
                boolField: true,
                textField: generateId(),
            },
        })
    }

    private async createRandomRecord() {
        const record = {
            id: generateId(),
            phoneNumber: '555-555-0000',
            requiredForCreate: generateId(),
            requiredForUpdate: generateId(),
        }
        await this.dummyStore.createOne(record)

        return this.findOne()
    }

    private async findOne() {
        const expected = await this.dummyStore.findOne(
            {},
            { shouldIncludePrivateFields: true }
        )

        return {
            ...expected,
            requiredForDatabase: true,
        }
    }
}

export const DEMO_PHONE = '555-555-5555'
export const DEMO_PHONE_FORMATTED = '+1 555-555-5555'
export const DEMO_PHONE2_FORMATTED = '+1 555-555-1234'
export const DEMO_PHONE3_FORMATTED = '+1 555-555-1235'
export const DEMO_PHONE4_FORMATTED = '+1 555-555-1236'

type RelatedSchemaType =
    | {
          textField?: string | null | undefined
          boolField?: boolean | null | undefined
      }
    | null
    | undefined

class DummySubClass extends DummyStore {}
