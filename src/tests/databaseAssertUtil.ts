import { assertOptions, SchemaError } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import SpruceError from '../errors/SpruceError'
import { Database, IndexWithFilter, TestConnect } from '../types/database.types'
import { DataStore } from '../types/stores.types'
import generateId from '../utilities/generateId'

const methods = [
    //connecting
    'assertThrowsWithInvalidConnectionString',
    'assertThrowsWhenCantConnect',
    'assertThrowsWithBadDatabaseName',

    //inserting
    'assertKnowsIfConnectionClosed',
    'assertCanSortDesc',
    'assertCanSortAsc',
    'assertCanSortById',
    'assertCanQueryWithOr',
    'assertGeneratesIdDifferentEachTime',
    'assertInsertingGeneratesId',
    'assertCanCreateMany',
    'assertCanCreateWithObjectField',

    //counting
    'assertCanCountOnId',
    'assertCanCount',

    //updating
    'assertThrowsWhenUpdatingRecordNotFound',
    'assertCanUpdate',
    'assertCanUpdateMany',
    'assertCanPushOntoArrayValue',
    'assertCanUpdateWithObjectField',
    'assertCanUpdateFieldInObjectFieldWithTargettedWhere',
    'assertCanSaveAndGetNullAndUndefined',
    'assertUpdateReturnsMatchedCounts',

    //upserting
    'assertCanUpsertOne',
    'assertCanUpsertNull',
    'assertCanPushToArrayOnUpsert',
    'assertCanSyncUniqueIndexesWithFilterExpression',

    //finding
    'assertEmptyDatabaseReturnsEmptyArray',
    'assertFindOneOnEmptyDatabaseReturnsNull',
    'assertCanLimitResults',
    'assertCanLimitResultsToZero',
    'assertCanFindWithBooleanField',
    'assertCanQueryByGtLtGteLteNe',
    'assertCanQueryPathWithDotSyntax',
    'assertCanReturnOnlySelectFields',
    'assertCanSearchByRegex',
    'assertCanFindWithNe',
    'assertCanFindWithIn',

    //deleting
    'assertCanDeleteRecord',
    'assertCanDeleteOne',

    //indexing
    'assertHasNoUniqueIndexToStart',
    'assertCanCreateUniqueIndex',
    'assertCanCreateMultiFieldUniqueIndex',
    'assertCantCreateUniqueIndexTwice',
    'assertCanDropUniqueIndex',
    'assertCanDropCompoundUniqueIndex',
    'assertCantDropUniqueIndexThatDoesntExist',
    'assertCantDropIndexWhenNoIndexExists',
    'assertCantDropCompoundUniqueIndexThatDoesntExist',
    'assertSyncingUniqueIndexsAddsMissingIndexes',
    'assertSyncingUniqueIndexsSkipsExistingIndexs',
    'assertSyncingUniqueIndexesRemovesExtraIndexes',
    'assertSyncingUniqueIndexesIsRaceProof',
    'assertSyncingIndexesDoesNotAddAndRemove',
    'assertUniqueIndexBlocksDuplicates',
    'assertDuplicateKeyThrowsOnInsert',
    'assertSettingUniqueIndexViolationThrowsSpruceError',
    'assertCanCreateUniqueIndexOnNestedField',
    'assertUpsertWithUniqueIndex',
    'assertNestedFieldIndexUpdates',
    'assertHasNoIndexToStart',
    'assertCanCreateIndex',
    'assertCantCreateSameIndexTwice',
    'assertCanCreateMultiFieldIndex',
    'assertCanDropIndex',
    'assertCanDropCompoundIndex',
    'assertCantDropCompoundIndexThatDoesNotExist',
    'assertSyncIndexesSkipsExisting',
    'assertSyncIndexesRemovesExtraIndexes',
    'assertSyncIndexesHandlesRaceConditions',
    'assertSyncIndexesDoesNotRemoveExisting',
    'assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected',
    'assertCanSyncIndexesWithoutPartialThenAgainWithProperlyUpdates',
] as const

type OriginalMethods = (typeof methods)[number]
type BangMethods = `!${OriginalMethods}`
export type DatabaseAssertionName = OriginalMethods | BangMethods

const databaseAssertUtil = {
    collectionName: 'test_collection',

    async runSuite(connect: TestConnect, tests?: DatabaseAssertionName[]) {
        assertOptions({ connect }, ['connect'])

        const db = await connectToDabatase(connect)
        await db.dropDatabase()
        await this.shutdown(db)

        const hasIgnore = tests?.find((t) => t.startsWith('!'))

        if (hasIgnore && tests) {
            for (const method of tests) {
                if (!method.startsWith('!')) {
                    throw new SchemaError({
                        code: 'INVALID_PARAMETERS',
                        parameters: ['tests'],
                    })
                }
            }

            const doesMatch = (m: DatabaseAssertionName) => {
                return !!tests!.find((t) => t.substring(1) === m)
            }
            const filtered = methods.filter((m) => !doesMatch(m))
            tests = filtered as DatabaseAssertionName[]
        }

        const toRun = tests ?? methods
        for (const method of toRun) {
            try {
                //@ts-ignore
                await this[method](connect)
            } catch (err: any) {
                const prefix = `Error in ${method}:\n\n `
                err.message = `${prefix} ${err.message}`
                err.stack = `${prefix} ${err.stack}`
                throw err
            }
        }
    },

    async _getIndexesWith_IdFilteredOut(db: Database) {
        return this._filterOut_Id(await db.getIndexes(this.collectionName))
    },

    _filterOut_Id(allIndexes: IndexWithFilter[]) {
        return allIndexes.filter((i) => i.fields[0] !== '_id')
    },
    async _assertUpdateUpdatedRightNumberOfRecords(
        db: Database,
        search: Record<string, any>,
        updates: Record<string, any>,
        expectedUpdateCount: number
    ) {
        const updated = await db.update(this.collectionName, search, updates)

        assert.isEqual(
            updated,
            expectedUpdateCount,
            'db.update() did not update the expected amount of records! Make sure it returns an integer of the number of records updated.'
        )

        const count = await db.count(this.collectionName, updates)
        assert.isEqual(count, expectedUpdateCount)
    },

    async assertGeneratesIdDifferentEachTime(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const id1 = db.generateId()
        const id2 = db.generateId()
        assert.isNotEqual(
            id1,
            id2,
            'generateId() must generate a different id each time'
        )
        await this.shutdown(db)
    },

    async assertCanSortDesc(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const second = await db.createOne(this.collectionName, {
            name: 'second',
            count: 1,
        })
        const third = await db.createOne(this.collectionName, {
            name: 'third',
            count: 5,
        })
        const first = await db.createOne(this.collectionName, {
            name: 'first',
            count: -1,
        })

        assert.isFunction(db.find, `db.find() must be a function.`)

        const results = await db.find(
            this.collectionName,
            {},
            {
                sort: [
                    {
                        field: 'count',
                        direction: 'desc',
                    },
                ],
            }
        )

        assert.isBelow(
            results.length,
            4,
            `You are not resetting data when .dropDatabase() is called. If you can't drop the database in your env, then you need to clear at all rows in all tables! Got back ${results.length} records!`
        )

        assert.isLength(
            results,
            3,
            `Should have 3 records back from find() after 3 createOne()s. Make sure your createOne() is inserting records! I only got back ${results.length} records!`
        )

        assert.isEqual(
            results[0].name,
            'third',
            `first record should be named "third" when sorting desc by name. Make sure you are sorting using the "sort" option.`
        )
        assert.isEqual(
            results[1].name,
            'second',
            `second record should be named "second" when sorting desc by name.`
        )
        assert.isEqual(
            results[2].name,
            'first',
            `third record should be named "first" when sorting desc by name.`
        )

        assert.isEqualDeep(
            results[0],
            third,
            `createOne() is not returning the record that was created!`
        )

        assert.isEqualDeep(
            results[1],
            second,
            `createOne() is not returning the record that was created!`
        )

        assert.isEqualDeep(
            results[2],
            first,
            `createOne() is not returning the record that was created!`
        )

        const result = await db.findOne(this.collectionName, undefined, {
            sort: [{ field: 'count', direction: 'desc' }],
        })
        assert.isTruthy(result, 'findOne() should return a record!')
        assert.isEqual(result.name, 'third', 'findOne() should honor sort!')

        await this.shutdown(db)
    },

    async assertCanSortAsc(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createOne(this.collectionName, { name: 'second', count: 1 })
        await db.createOne(this.collectionName, { name: 'third', count: 5 })
        await db.createOne(this.collectionName, { name: 'first', count: -1 })

        const results = await db.find(
            this.collectionName,
            {},
            {
                sort: [
                    {
                        field: 'count',
                        direction: 'asc',
                    },
                ],
            }
        )

        assert.isEqual(
            results[0].name,
            'first',
            'find is not sorting ascending'
        )
        assert.isEqual(
            results[1].name,
            'second',
            'find is not sorting ascending'
        )
        assert.isEqual(
            results[2].name,
            'third',
            'find is not sorting ascending'
        )

        const result = await db.findOne(this.collectionName, undefined, {
            sort: [{ field: 'count', direction: 'asc' }],
        })
        assert.isTruthy(result)
        assert.isEqual(result.name, 'first')

        await this.shutdown(db)
    },

    async assertInsertingGeneratesId(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const name = generateId()
        const inserted = await db.createOne(this.collectionName, {
            name,
        })

        assert.isTruthy(inserted, "createOne() didn't return anything!")
        assert.isTruthy(inserted.id, 'createOne() record id is missing!')
        assert.isEqual(
            inserted.name,
            name,
            'createOne() record name field was not set to ' + name
        )

        await this.shutdown(db)
    },

    async assertThrowsWhenUpdatingRecordNotFound(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        assert.isFunction(
            db.generateId,
            `db.generateId() must be a function that returns a unique identifier.`
        )

        assert.isFunction(
            db.updateOne,
            'You must implement updateOne() in your database adapter.'
        )

        await this._assertThrowsExpectedNotFoundOnUpdateOne(db, {
            id: db.generateId(),
        })
        await this._assertThrowsExpectedNotFoundOnUpdateOne(db, { count: 10 })

        await this.shutdown(db)
    },

    async shutdown(db: Database) {
        if (db.isConnected()) {
            await db.dropDatabase()
            await db.close()
        }
    },

    async assertCanCreateUniqueIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['uniqueField'])
        let indexes = (await db.getUniqueIndexes(
            this.collectionName
        )) as IndexWithFilter[]

        assert.isLength(
            indexes,
            1,
            'getUniqueIndexes() did not return the unique index I tried to create!'
        )
        assert.isLength(
            indexes[0].fields,
            1,
            'getUniqueIndexes() needs to return an array of IndexWithFilters. Each item in the array should be an array of fields that make up the unique index.'
        )
        assert.isEqual(
            indexes[0].fields[0].toLowerCase(),
            'uniqueField'.toLowerCase(),
            'getUniqueIndexes() did not add the expected field to the first unique index.'
        )

        await db.createUniqueIndex(this.collectionName, ['uniqueField2'])
        indexes = await db.getUniqueIndexes(this.collectionName)

        assert.isLength(indexes, 2)
        assert.isEqual(
            indexes[1].fields[0].toLowerCase(),
            'uniqueField2'.toLowerCase()
        )

        await db.createUniqueIndex(this.collectionName, [
            'uniqueField3',
            'uniqueField4',
        ])
        indexes = await db.getUniqueIndexes(this.collectionName)

        assert.isLength(indexes, 3)
        assert.isEqual(
            indexes[2].fields[0].toLowerCase(),
            'uniqueField3'.toLowerCase()
        )
        assert.isEqual(
            indexes[2].fields[1].toLowerCase(),
            'uniqueField4'.toLowerCase()
        )
        await this.shutdown(db)
    },

    async assertHasNoUniqueIndexToStart(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            0,
            "getUniqueIndexes() should return an empty array when there are no unique indexes (primary key indexes don't count!). Also, make sure that dropDatabase() in your adapter clears out any unique indexes you've created."
        )
        await this.shutdown(db)
    },

    async assertCanUpsertOne(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const id = db.generateId()

        const created = await db.upsertOne(
            this.collectionName,
            { id },
            {
                id,
                name: 'first',
            }
        )

        assert.isTruthy(
            created,
            'upsertOne() should return the record it created!'
        )
        assert.isEqual(created.name, 'first')
        assert.isEqual(`${created.id}`, `${id}`, 'ids do not match!')

        const upserted = await db.upsertOne(
            this.collectionName,
            { id },
            { name: 'second' }
        )

        const id2 = db.generateId()
        await db.upsertOne(
            this.collectionName,
            { id: id2 },
            { name: 'second', id: id2 }
        )

        assert.isTruthy(upserted)
        assert.isEqual(created.id, upserted.id)
        assert.isEqual(upserted.name, 'second')

        const upserted2 = await db.upsertOne(
            this.collectionName,
            { id },
            { name: 'third' }
        )

        assert.isTruthy(upserted2)
        assert.isEqual(upserted2.name, 'third')

        const match = await db.findOne(this.collectionName, { id })

        assert.isEqualDeep(
            match,
            upserted2,
            'upsertOne() did not update the record!'
        )

        await this.shutdown(db)
    },

    async assertCanDeleteOne(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.create(this.collectionName, [
            {
                name: 'a record',
            },
            {
                name: 'a record',
            },
            {
                name: 'a record',
            },
        ])

        await db.deleteOne(this.collectionName, { name: 'a record' })

        const count = await db.count(this.collectionName)

        assert.isEqual(count, 2, 'deleteOne() did not delete a single record!')

        await this.shutdown(db)
    },

    async assertCanDeleteRecord(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const created = await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'first',
        })

        const matchedBeforeDelete = await db.findOne(this.collectionName, {
            id: created.id,
        })

        assert.isTruthy(matchedBeforeDelete)
        assert.isEqual(matchedBeforeDelete.id, created.id)

        const numDeleted = await db.delete(this.collectionName, {
            id: matchedBeforeDelete.id,
        })

        assert.isEqual(numDeleted, 1)

        const matchedAfterDelete = await db.findOne(this.collectionName, {
            id: created.id,
        })

        assert.isFalsy(
            matchedAfterDelete,
            `Record with the id of ${created.id} was not deleted!`
        )

        await db.create(this.collectionName, [
            {
                name: 'a record',
            },
            {
                name: 'a record',
            },
            {
                name: 'a record',
            },
        ])

        const manyDeleted = await db.delete(this.collectionName, {})

        assert.isEqual(
            manyDeleted,
            3,
            `delete() did not return the total recrods deleted!`
        )

        await this.shutdown(db)
    },

    async assertCanLimitResultsToZero(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'first',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'second',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'third',
        })

        const results = await db.find(this.collectionName, undefined, {
            limit: 0,
            sort: [{ field: 'name', direction: 'asc' }],
        })

        assert.isLength(results, 0)

        await this.shutdown(db)
    },

    async assertCanLimitResults(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'first',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'second',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'third',
        })

        const results = await db.find(this.collectionName, undefined, {
            limit: 2,
            sort: [{ field: 'name', direction: 'asc' }],
        })

        assert.isLength(results, 2)
        assert.isEqual(results[0].name, 'first')
        assert.isEqual(results[1].name, 'second')

        await this.shutdown(db)
    },

    async assertFindOneOnEmptyDatabaseReturnsNull(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const results = await db.findOne(this.collectionName, { id: '111' })
        assert.isFalsy(results)

        await this.shutdown(db)
    },

    async assertEmptyDatabaseReturnsEmptyArray(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const results = await db.find(this.collectionName, { id: '111' })
        assert.isLength(results, 0)

        await this.shutdown(db)
    },

    async assertCanPushOntoArrayValue(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const inserted = await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'nope',
            names: ['first'],
        })

        const updated = await db.updateOne(
            this.collectionName,
            { id: inserted.id },
            {
                $push: { names: 'second' },
            }
        )

        assert.isEqualDeep(updated.names, ['first', 'second'])

        const matched = await db.findOne(this.collectionName, {
            id: updated.id,
        })

        assert.isTruthy(matched)
        assert.isEqualDeep(matched.names, ['first', 'second'])

        await this.shutdown(db)
    },

    async assertCanCreateWithObjectField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const values = {
            name: 'first',
            target: {
                organizationId: generateId(),
                locationId: generateId(),
            },
        }

        let created: Record<string, any> | undefined
        try {
            created = await db.createOne(this.collectionName, values)
        } catch {
            assert.fail(
                'createOne() tried to create a record with an object field. Make sure the target field handles objects!'
            )
        }

        assert.isTruthy(
            created,
            'createOne() did not return the record created!'
        )

        const matched = await db.findOne(this.collectionName, {
            id: created!.id,
        })

        assert.isTruthy(
            matched,
            `findOne() with id ${created.id} returned null`
        )

        assert.isEqualDeep(matched, { ...created, id: matched!.id })

        await this.shutdown(db)
    },

    async assertCanUpdateWithObjectField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const values = {
            name: 'first',
            target: {
                organizationId: generateId(),
                locationId: generateId(),
            },
        }

        const created = await db.createOne(this.collectionName, values)
        const target = {
            organizationId: 'hey',
            locationId: 'there',
        }
        await db.updateOne(
            this.collectionName,
            { id: created.id },
            {
                target,
            }
        )
        const matched = await db.findOne(this.collectionName, {
            id: created!.id,
        })

        assert.isTruthy(
            matched,
            `findOne() with id ${created.id} returned null`
        )

        assert.isEqualDeep(
            matched!.target,
            target,
            `field called "target" which is an object was not updated as expected.`,
            true
        )

        await this.shutdown(db)
    },

    async assertCanUpdateFieldInObjectFieldWithTargettedWhere(
        connect: TestConnect
    ) {
        const db = await connectToDabatase(connect)

        const target = {
            organizationId: generateId(),
            locationId: generateId(),
        }
        const values = {
            name: 'first',
            target,
        }

        const created = await db.createOne(this.collectionName, values)
        await db.updateOne(
            this.collectionName,
            { id: created.id },
            {
                'target.organizationId': 'oy oy',
            }
        )
        const matched = await db.findOne(this.collectionName, {
            id: created!.id,
        })

        assert.isEqualDeep(matched!.target, {
            ...target,
            organizationId: 'oy oy',
        })

        await this.shutdown(db)
    },

    async assertCanCreateMany(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const values = [
            { name: 'ry' },
            { name: 'tay' },
            { name: 'bill' },
            { name: 'bob' },
        ]

        const results = await db.create(this.collectionName, values)

        assert.isLength(results, values.length)
        for (const val of values) {
            assert.doesInclude(
                results,
                val,
                'Create many did not return the expected records!'
            )
        }

        await this.shutdown(db)
    },

    async assertCanUpdateMany(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.create(this.collectionName, [
            {
                name: 'one',
                number: 1,
            },
            {
                name: 'two',
                number: 1,
            },
            {
                name: 'three',
                number: 1,
            },
        ])

        await this._assertUpdateUpdatedRightNumberOfRecords(
            db,
            { name: 'one' },
            { name: 'one-updated' },
            1
        )

        await this._assertUpdateUpdatedRightNumberOfRecords(
            db,
            { number: 1 },
            { number: 2 },
            3
        )

        await this.shutdown(db)
    },

    async assertCanQueryWithOr(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const name1 = generateId()
        const name2 = generateId()

        assert.isFunction(
            db.create,
            'db.create() must be a function that creates records and returns it.'
        )

        await db.create(this.collectionName, [
            {
                isPublic: true,
                name: name1,
            },
            {
                name: name2,
            },
        ])

        await this._assert$orReturnsExpectedTotalRecords(
            db,
            [{ isPublic: true }, { name: name2 }],
            2
        )

        await this._assert$orReturnsExpectedTotalRecords(
            db,
            [{ isPublic: true }],
            1
        )

        await this.shutdown(db)
    },

    async assertCanUpdate(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const inserted = await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'first',
        })

        assert.isTruthy(
            inserted,
            'createOne needs to return the record that was inserted!'
        )
        assert.isTruthy(
            inserted.id,
            `an id must be return with the record from createOne!`
        )
        assert.isEqual(
            inserted.name,
            'first',
            'name did not set as expected on the inserted record'
        )

        const updated = await db.updateOne(
            this.collectionName,
            { id: inserted.id },
            {
                name: 'updated',
            }
        )

        assert.isTruthy(
            updated,
            `updateOne needs to return the record that was updated!`
        )

        assert.isEqual(updated.id, inserted.id)
        assert.isEqual(updated.name, 'updated')

        await this.shutdown(db)
    },

    async assertCanSortById(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'first',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'second',
        })
        await db.createOne(this.collectionName, {
            id: db.generateId(),
            name: 'third',
        })

        const results = await db.find(
            this.collectionName,
            {},
            {
                sort: [
                    {
                        field: 'id',
                        direction: 'desc',
                    },
                ],
            }
        )

        assert.isEqual(results[0].name, 'third')
        assert.isEqual(results[1].name, 'second')
        assert.isEqual(results[2].name, 'first')

        const result = await db.findOne(this.collectionName, undefined, {
            sort: [{ field: 'id', direction: 'desc' }],
        })
        assert.isTruthy(result)
        assert.isEqual(result.name, 'third')

        await this.shutdown(db)
    },

    async assertCanCreateMultiFieldUniqueIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, [
            'uniqueField',
            'uniqueField2',
        ])

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 'hello world',
            uniqueField2: 'hello again',
        })

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 'hello world',
            uniqueField2: 'unique',
        })

        let err = (await assert.doesThrowAsync(
            () =>
                db.createOne(this.collectionName, {
                    name: generateId(),
                    uniqueField: 'hello world',
                    uniqueField2: 'unique',
                }),
            undefined,
            `createOne() should throw a SpruceError with the code: DUPLICATE_RECORD`
        )) as SpruceError

        lowerCaseErrorDuplicateFields(err)

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: [
                'uniqueField'.toLowerCase(),
                'uniqueField2'.toLowerCase(),
            ],
            duplicateValues: ['hello world', 'unique'],
            action: 'create',
        })

        await db.upsertOne(
            this.collectionName,
            {
                uniqueField: 'hello world',
                uniqueField2: 'unique',
            },
            {
                name: generateId(),
                uniqueField: 'hello world',
                uniqueField2: 'unique2',
            }
        )

        err = (await assert.doesThrowAsync(
            () =>
                db.upsertOne(
                    this.collectionName,
                    {
                        uniqueField: 'hello world',
                        uniqueField2: 'unique2',
                    },
                    {
                        name: generateId(),
                        uniqueField: 'hello world',
                        uniqueField2: 'hello again',
                    }
                ),
            undefined,
            'upsertOne() should throw a SpruceError with the code: DUPLICATE_RECORD'
        )) as SpruceError

        lowerCaseErrorDuplicateFields(err)

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: [
                'uniqueField'.toLowerCase(),
                'uniqueField2'.toLowerCase(),
            ],
            duplicateValues: ['hello world', 'hello again'],
            action: 'upsertOne',
        })

        await this.shutdown(db)
    },

    async assertSettingUniqueIndexViolationThrowsSpruceError(
        connect: TestConnect
    ) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['randomUniqueField'])

        await db.createOne(this.collectionName, {
            uniqueField: 'hello world',
            randomUniqueField: '1',
            name: generateId(),
        })

        await db.createOne(this.collectionName, {
            uniqueField: 'hello world',
            randomUniqueField: '2',
            name: generateId(),
        })

        let err = await assert.doesThrowAsync(() =>
            db.syncUniqueIndexes(this.collectionName, [['uniqueField']])
        )

        errorAssert.assertError(err, 'DUPLICATE_KEY')
        await this.shutdown(db)
    },

    async assertDuplicateKeyThrowsOnInsert(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['uniqueField'])

        await db.createOne(this.collectionName, {
            uniqueField: 'hello world',
            name: generateId(),
        })

        let err = await assert.doesThrowAsync(() =>
            db.createOne(this.collectionName, {
                uniqueField: 'hello world',
                name: generateId(),
            })
        )

        lowerCaseErrorDuplicateFields(err)

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            duplicateFields: ['uniquefield'],
            duplicateValues: ['hello world'],
            collectionName: this.collectionName,
        })
        await this.shutdown(db)
    },

    async assertSyncingIndexesDoesNotAddAndRemove(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createUniqueIndex(this.collectionName, ['otherField'])
        await db.createUniqueIndex(this.collectionName, ['someField'])

        db.createUniqueIndex = () => {
            throw new Error('Should not have been called')
        }
        db.dropIndex = () => {
            throw new Error('Should not have been called')
        }

        await db.syncUniqueIndexes(this.collectionName, [
            ['someField'],
            ['otherField'],
        ])
        await this.shutdown(db)
    },

    async assertSyncingUniqueIndexesRemovesExtraIndexes(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.syncUniqueIndexes(this.collectionName, [
            ['uniqueField'],
            ['someField'],
            ['otherField', 'otherField2'],
        ])
        let indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            3,
            'syncUniqueIndexes() should have created 3 indexes.'
        )

        await db.syncUniqueIndexes(this.collectionName, [['uniqueField']])

        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 1)
        assert.isEqual(indexes[0].fields[0].toLowerCase(), 'uniquefield')

        await db.syncUniqueIndexes(this.collectionName, [
            {
                fields: ['uniqueField'],
                filter: { isPublic: true },
            },
        ])

        await db.syncUniqueIndexes(this.collectionName, [
            {
                fields: ['otherField', 'otherField2'],
                filter: { otherField: { $exists: true } },
            },
            {
                fields: ['uniqueField'],
                filter: { isPublic: true },
            },
        ])

        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            2,
            `Syncing unique indexs with filter is not removing extra indexes.`
        )

        await this.shutdown(db)
    },

    async assertSyncingUniqueIndexsSkipsExistingIndexs(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.syncUniqueIndexes(this.collectionName, [['uniqueField']])

        let indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 1)

        await db.syncUniqueIndexes(this.collectionName, [
            ['uniqueField'],
            ['someField'],
            ['otherField', 'otherField2'],
        ])

        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 3)
        await this.shutdown(db)
    },

    async assertSyncingUniqueIndexsAddsMissingIndexes(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.syncUniqueIndexes(this.collectionName, [['uniqueField']])

        let indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 1, 'There should be 1 index after syncing.')

        await db.syncUniqueIndexes(this.collectionName, [['someField']])

        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            1,
            'syncUniqueIndexes() should have removed the index that was set before it that was different.'
        )

        await db.syncUniqueIndexes(this.collectionName, [
            ['uniqueField'],
            ['someField'],
        ])

        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            2,
            'There should still be 2 indexes after this syncUniqueIndexs(). First sync was a single field unique index, second sync was two indexes, but one was already there. So one should have been ignored, one should have been added.'
        )
        await this.shutdown(db)
    },

    async assertCantDropCompoundUniqueIndexThatDoesntExist(
        connect: TestConnect
    ) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, [
            'someField',
            'someOtherField',
        ])

        const err = await assert.doesThrowAsync(() =>
            db.dropIndex(this.collectionName, ['someOtherField', 'uniqueField'])
        )

        lowerCaseMissingIndexValues(err)

        errorAssert.assertError(err, 'INDEX_NOT_FOUND', {
            collectionName: this.collectionName,
            missingIndex: ['someotherfield', 'uniquefield'],
        })
        await this.shutdown(db)
    },

    async assertCantDropIndexWhenNoIndexExists(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const err = await assert.doesThrowAsync(() =>
            db.dropIndex(this.collectionName, ['someOtherField'])
        )

        lowerCaseMissingIndexValues(err)

        errorAssert.assertError(err, 'INDEX_NOT_FOUND', {
            collectionName: this.collectionName,
            missingIndex: ['someotherfield'],
        })
        await this.shutdown(db)
    },

    async assertCantDropUniqueIndexThatDoesntExist(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['someField'])

        const err = await assert.doesThrowAsync(() =>
            db.dropIndex(this.collectionName, ['someOtherField'])
        )

        lowerCaseMissingIndexValues(err)

        errorAssert.assertError(err, 'INDEX_NOT_FOUND', {
            collectionName: this.collectionName,
            missingIndex: ['someotherfield'],
        })

        await this.shutdown(db)
    },

    async assertCanDropCompoundUniqueIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, [
            'someField',
            'otherField',
        ])
        await db.dropIndex(this.collectionName, ['someField', 'otherField'])

        let indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 0)

        await db.createUniqueIndex(this.collectionName, [
            'someField',
            'someField2',
        ])
        await db.createUniqueIndex(this.collectionName, [
            'someField',
            'someField3',
        ])
        await db.dropIndex(this.collectionName, ['someField', 'someField3'])
        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 1)

        await this.shutdown(db)
    },

    async assertCanDropUniqueIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['someField'])
        await db.dropIndex(this.collectionName, ['someField'])

        let indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(
            indexes,
            0,
            'getUniqueIndexes() still returned an index even though it should not have after dropIndex().'
        )

        await db.createUniqueIndex(this.collectionName, ['someField2'])
        await db.createUniqueIndex(this.collectionName, ['someField3'])
        await db.dropIndex(this.collectionName, ['someField3'])
        indexes = await db.getUniqueIndexes(this.collectionName)
        assert.isLength(indexes, 1)

        await this.shutdown(db)
    },

    async assertCantCreateUniqueIndexTwice(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await assertCantCreateUniqueIndexTwice(
            db,
            this.collectionName,
            ['uniqueField'],
            1
        )

        await assertCantCreateUniqueIndexTwice(
            db,
            this.collectionName,
            ['uniqueField', 'someField2'],
            2
        )

        await this.shutdown(db)
    },
    async assertSyncingUniqueIndexesIsRaceProof(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const syncs = [
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncUniqueIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
        ]
        await Promise.all(syncs)

        await this.shutdown(db)
    },
    async assertUniqueIndexBlocksDuplicates(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, ['uniqueField'])

        await db.createOne(this.collectionName, {
            uniqueField: 'hello world',
            name: 'hello world',
        })

        let err = (await assert.doesThrowAsync(() =>
            db.createOne(this.collectionName, {
                uniqueField: 'hello world',
                name: 'hello world',
            })
        )) as SpruceError

        lowerCaseStringArray(err, 'duplicateFields')

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: ['uniquefield'],
            duplicateValues: ['hello world'],
            action: 'create',
        })

        const created = await db.createOne(this.collectionName, {
            uniqueField: 'pass',
            name: 'hello world',
        })

        err = (await assert.doesThrowAsync(() =>
            db.updateOne(
                this.collectionName,
                { id: created.id },
                { uniqueField: 'hello world' }
            )
        )) as SpruceError

        lowerCaseStringArray(err, 'duplicateFields')

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: ['uniquefield'],
            duplicateValues: ['hello world'],
            action: 'updateOne',
        })

        let promises: Promise<any>[] = []
        for (let c = 0; c <= 10; c++) {
            promises.push(
                db.createOne(this.collectionName, {
                    uniqueField: 'fast',
                    name: 'hello world',
                })
            )
        }

        err = (await assert.doesThrowAsync(() =>
            Promise.all(promises)
        )) as SpruceError

        lowerCaseStringArray(err, 'duplicateFields')

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            duplicateFields: ['uniquefield'],
            duplicateValues: ['fast'],
        })

        promises = []
        for (let c = 0; c <= 10; c++) {
            promises.push(
                db.upsertOne(
                    this.collectionName,
                    { uniqueField: `${c}` },
                    {
                        uniqueField: 'upsertFast',
                        name: 'hello world',
                    }
                )
            )
        }

        err = (await assert.doesThrowAsync(() =>
            Promise.all(promises)
        )) as SpruceError

        errorAssert.assertError(err, 'DUPLICATE_RECORD')

        await this.shutdown(db)
    },

    async assertCanCreateUniqueIndexOnNestedField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        try {
            await db.createUniqueIndex(this.collectionName, [
                'target.organizationId',
                'slug',
            ])
        } catch (err: any) {
            assert.fail(
                `Trying to create a unique index on target.organizationId and slug failed.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        await db.createOne(this.collectionName, {
            name: generateId(),
            target: {
                organizationId: 'go!',
                locationId: null,
            },
            slug: 'a slug',
        })

        const err = await assert.doesThrowAsync(() =>
            db.createOne(this.collectionName, {
                name: generateId(),
                target: {
                    organizationId: 'go!',
                    locationId: null,
                },
                slug: 'a slug',
            })
        )

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: ['slug', 'target.organizationId'],
            duplicateValues: ['a slug', 'go!'],
            action: 'create',
        })

        await db.upsertOne(
            this.collectionName,
            {
                target: {
                    organizationId: 'go!',
                },
            },
            {
                name: 'test',
                target: {
                    organizationId: 'go 2!',
                    locationId: null,
                },
                slug: 'a slug',
            }
        )

        await this.shutdown(db)
    },

    async assertCanPushToArrayOnUpsert(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const record = await db.createOne(this.collectionName, {
            name: 'test',
            names: [],
        })
        await db.updateOne(
            this.collectionName,
            {
                id: record.id,
            },
            {
                $push: { names: 'test' },
            }
        )

        const match = await db.findOne(this.collectionName)
        assert.isEqualDeep(match?.names, ['test'])

        await this.shutdown(db)
    },

    async assertCanSearchByRegex(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.create(this.collectionName, [
            {
                name: 'first',
                target: {
                    score: 1,
                },
            },
            {
                name: 'second',
                target: {
                    score: 2,
                },
            },
            {
                name: 'third',
                target: {
                    score: 2,
                },
            },
        ])

        const all = await db.find(
            this.collectionName,
            { name: { $regex: /fi/ } },
            { includeFields: ['name'] }
        )
        assert.isEqualDeep(
            all,
            [
                {
                    name: 'first',
                },
            ],
            'Searching by regex failed.!'
        )

        await this.shutdown(db)
    },

    async assertCanReturnOnlySelectFields(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.create(this.collectionName, [
            {
                name: 'first',
                target: {
                    score: 1,
                },
            },
            {
                name: 'second',
                target: {
                    score: 2,
                },
            },
            {
                name: 'third',
                target: {
                    score: 2,
                },
            },
        ])

        const all = await db.find(
            this.collectionName,
            {},
            { includeFields: ['name'] }
        )
        assert.isEqualDeep(all, [
            {
                name: 'first',
            },
            {
                name: 'second',
            },
            {
                name: 'third',
            },
        ])

        const first = await db.findOne(
            this.collectionName,
            {},
            { includeFields: ['target'] }
        )

        assert.isEqualDeep(first, {
            target: {
                score: 1,
            },
        })

        await this.shutdown(db)
    },

    async assertThrowsWithBadDatabaseName(connect: TestConnect) {
        const {
            db,
            connectionStringWithRandomBadDatabaseName:
                connectionStringWithRandomBadDatabaseName,
            badDatabaseName,
        } = await connect()
        await this.shutdown(db)

        const err = await assert.doesThrowAsync(() =>
            connect(connectionStringWithRandomBadDatabaseName)
        )
        errorAssert.assertError(err, 'INVALID_DATABASE_NAME', {
            suppliedName: badDatabaseName,
        })
    },

    async assertThrowsWhenCantConnect(connect: TestConnect) {
        const { db, scheme } = await connect()
        await this.shutdown(db)

        const err = await assert.doesThrowAsync(() =>
            connect(`${scheme}localhost:9999`)
        )
        errorAssert.assertError(err, 'UNABLE_TO_CONNECT_TO_DB')
    },

    async assertThrowsWithInvalidConnectionString(connect: TestConnect) {
        const err = await assert.doesThrowAsync(() => connect(generateId()))
        errorAssert.assertError(err, 'INVALID_DB_CONNECTION_STRING')
    },

    async assertKnowsIfConnectionClosed(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        assert.isFunction(
            db.isConnected,
            `db.isConnected() needs to be a function!`
        )
        assert.isTrue(
            db.isConnected(),
            'isConnected() should return true when connected'
        )

        await db.close()

        assert.isFalse(
            db.isConnected(),
            'isConnected() should return false when disconnected (after calling db.close())'
        )

        await this.shutdown(db)
    },

    async assertCanQueryPathWithDotSyntax(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.create(this.collectionName, [
            {
                name: 'first',
                target: {
                    score: 1,
                },
            },
            {
                name: 'second',
                target: {
                    score: 2,
                },
            },
            {
                name: 'third',
                target: {
                    score: 2,
                },
            },
        ])

        const secondMatch = await db.findOne(this.collectionName, {
            'target.score': 2,
        })

        assert.isTruthy(secondMatch, 'Could not match on path with dot syntax.')
        assert.isEqual(secondMatch.name, 'second')

        await this.shutdown(db)
    },

    async assertCanQueryByGtLtGteLteNe(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const created = await db.create(this.collectionName, [
            {
                number: 1,
                name: generateId(),
                someField: null,
            },
            {
                number: 2,
                name: generateId(),
                someField: 'test',
            },
            {
                number: 3,
                name: generateId(),
                someField: 'test',
            },
            {
                number: 4,
                name: generateId(),
                someField: 'test',
            },
        ])

        const gtMatches = await db.find(this.collectionName, {
            number: { $gt: 3 },
        })

        assert.isLength(gtMatches, 1, 'Expected 1 match for $gt: 3')
        assert.isEqual(
            gtMatches[0].number,
            4,
            'Did not match the expected result for $gt: 3'
        )

        const gteMatches = await db.find(this.collectionName, {
            number: { $gte: created[2].number },
        })

        assert.isLength(gteMatches, 2)
        assert.isEqual(gteMatches[0].number, 3)
        assert.isEqual(gteMatches[1].number, 4)

        const ltMatches = await db.find(this.collectionName, {
            number: { $lt: created[2].number },
        })

        assert.isLength(ltMatches, 2)
        assert.isEqual(ltMatches[0].number, 1)
        assert.isEqual(ltMatches[1].number, 2)

        const lteMatches = await db.find(this.collectionName, {
            number: { $lte: created[2].number },
        })

        assert.isLength(lteMatches, 3)
        assert.isEqual(lteMatches[0].number, 1)
        assert.isEqual(lteMatches[1].number, 2)
        assert.isEqual(lteMatches[2].number, 3)

        const notMatches = await db.find(this.collectionName, {
            id: {
                $ne: created[0].id,
            },
        })

        assert.isNotEqual(notMatches[0].id, created[0].id)
        assert.isLength(notMatches, created.length - 1)

        const notNull = await db.find(this.collectionName, {
            someField: {
                $ne: null,
            },
        })

        assert.isLength(notNull, created.length - 1)

        await this.shutdown(db)
    },

    async assertCanFindWithNe(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const record1 = await db.createOne(this.collectionName, {
            name: 'bar',
            someField: 'world',
        })

        await db.createOne(this.collectionName, {
            name: 'bar2',
            someField: 'world',
        })

        await db.createOne(this.collectionName, {
            name: 'bar3',
            someField: 'planet',
        })

        const query = { id: { $ne: record1.id } }
        const results = await db.find(this.collectionName, query)

        assert.isLength(results, 2)

        await this.shutdown(db)
    },

    async assertCanFindWithIn(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const record1 = await db.createOne(this.collectionName, {
            name: 'bar',
            otherField: 'world',
        })

        const record2 = await db.createOne(this.collectionName, {
            name: 'bar2',
            otherField: 'world',
        })

        const record3 = await db.createOne(this.collectionName, {
            name: 'bar3',
            otherField: 'planet',
        })

        const query = { id: { $in: [record1.id, record2.id, record3.id] } }
        const results = await db.find(this.collectionName, query)

        assert.isLength(results, 3)

        await this.shutdown(db)
    },

    async assertCanFindWithBooleanField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const first = await db.createOne(this.collectionName, {
            name: generateId(),
            isPublic: true,
        })

        const second = await db.createOne(this.collectionName, {
            name: generateId(),
            isPublic: false,
        })

        const firstMatch = await db.findOne(this.collectionName, {
            isPublic: true,
        })

        assert.isEqualDeep(
            firstMatch,
            first,
            `Searching where boolean field is true failed.`
        )

        const secondMatch = await db.findOne(this.collectionName, {
            isPublic: false,
        })

        assert.isEqualDeep(
            secondMatch,
            second,
            `Searching where boolean field is false failed.`
        )

        await this.shutdown(db)
    },

    async assertCanCountOnId(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const first = await db.createOne(this.collectionName, {
            name: 'bar',
            otherField: 'world',
        })
        const second = await db.createOne(this.collectionName, {
            name: 'bar2',
            otherField: 'world',
        })
        const third = await db.createOne(this.collectionName, {
            name: 'bar3',
            otherField: 'planet',
        })

        const countFirst = await db.count(this.collectionName, { id: first.id })
        const countSecond = await db.count(this.collectionName, {
            id: { $in: [first.id, second.id] },
        })
        const countThird = await db.count(this.collectionName, {
            id: { $in: [first.id, second.id, third.id] },
        })

        assert.isEqual(countFirst, 1)
        assert.isEqual(countSecond, 2)
        assert.isEqual(countThird, 3)

        await this.shutdown(db)
    },

    async assertCanCount(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createOne(this.collectionName, {
            name: 'bar',
            otherField: 'world',
        })
        await db.createOne(this.collectionName, {
            name: 'bar2',
            otherField: 'world',
        })
        await db.createOne(this.collectionName, {
            name: 'bar3',
            otherField: 'planet',
        })

        const countAll = await db.count(this.collectionName)

        assert.isEqual(countAll, 3)

        await this.shutdown(db)
    },

    async assertCanUpsertNull(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const createdUndefined = await db.upsertOne(
            this.collectionName,
            {
                undefinedField: undefined,
            },
            {
                undefinedField: undefined,
                name: generateId(),
            }
        )

        assert.isTruthy(createdUndefined)
        assert.isTrue(
            createdUndefined.undefinedField === null ||
                createdUndefined.undefinedfield === null
        )

        const createdNull = await db.upsertOne(
            this.collectionName,
            {
                nullField: null,
                name: '234',
            },
            {
                nullField: null,
                name: generateId(),
            }
        )

        assert.isTruthy(createdNull)

        let all = await db.find(this.collectionName)

        assert.isLength(all, 2, 'I expected to find 2 records after 2 upserts.')

        const updatedUndefined = await db.upsertOne(
            this.collectionName,
            {
                undefinedField: undefined,
            },
            { undefinedField: 'now defined' }
        )

        assert.isEqual(updatedUndefined.id, createdUndefined.id)
        assert.isEqual(
            updatedUndefined.undefinedField ?? updatedUndefined.undefinedfield,
            'now defined'
        )

        const updatedNull = await db.upsertOne(
            this.collectionName,
            {
                nullField: null,
            },
            { nullField: 'now defined' }
        )

        assert.isEqual(updatedNull.id, createdNull.id)
        assert.isEqual(
            updatedNull.nullField ?? updatedNull.nullfield,
            'now defined',
            'nullField should have upserted to "now defined"'
        )

        all = await db.find(this.collectionName)

        assert.isLength(all, 2)

        await this.shutdown(db)
    },

    async assertCanSaveAndGetNullAndUndefined(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const created = await db.createOne(this.collectionName, {
            undefinedField: undefined,
            nullField: null,
            name: 'hey',
        })

        assert.isTrue(
            created.undefinedField === null || created.undefinedfield === null,
            'undefinedField should be null'
        )
        assert.isTrue(
            created.nullField === null || created.nullfield === null,
            'nullField should be null'
        )

        const matchedUndefined = await db.findOne(this.collectionName, {
            undefinedField: undefined,
        })

        assert.isTruthy(matchedUndefined)
        assert.isTrue(
            matchedUndefined.undefinedField === null ||
                matchedUndefined.undefinedfield === null,
            'findOne should return null for undefinedField'
        )

        const matchedNull = await db.findOne(this.collectionName, {
            nullField: null,
        })

        assert.isTruthy(matchedNull)
        assert.isTrue(
            matchedNull.nullField === null || matchedNull.nullfield === null,
            'findOne should return null for nullField'
        )

        const updatedUndefined = await db.updateOne(
            this.collectionName,
            {
                undefinedField: undefined,
            },
            { undefinedField: 'now defined' }
        )

        assert.isEqual(updatedUndefined.id, created.id)
        assert.isEqual(
            updatedUndefined.undefinedField ?? updatedUndefined.undefinedfield,
            'now defined'
        )

        const updatedNull = await db.updateOne(
            this.collectionName,
            {
                nullField: null,
            },
            { nullField: 'now defined' }
        )

        assert.isEqual(
            updatedNull.nullField ?? updatedNull.nullfield,
            'now defined'
        )

        await this.shutdown(db)
    },

    async assertSyncIndexesDoesNotRemoveExisting(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createIndex(this.collectionName, ['otherField'])
        await db.createIndex(this.collectionName, ['someField'])

        db.createIndex = () => {
            throw new Error('Should not have been called')
        }
        db.dropIndex = () => {
            throw new Error('Should not have been called')
        }

        await db.syncIndexes(this.collectionName, [
            ['someField'],
            ['otherField'],
        ])
        await this.shutdown(db)
    },

    async assertCanSyncUniqueIndexesWithFilterExpression(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        try {
            await db.syncUniqueIndexes(this.collectionName, [
                {
                    fields: ['uniqueField', 'someField3'],
                    filter: {
                        uniqueField: { $type: 'string' },
                    },
                },
            ])
        } catch (err: any) {
            assert.fail(
                `syncUniqueIndexes() should not have thrown an error when syncing a unique index with a filter expression.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        try {
            await db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: 'test',
                slug: null,
                someField3: 'test',
            })
        } catch (err: any) {
            assert.fail(
                `Creating a record should not have thrown an error after syncing a unique index with a filter expression.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        await assert.doesThrowAsync(
            () =>
                db.createOne(this.collectionName, {
                    name: generateId(),
                    uniqueField: 'test',
                    slug: null,
                    someField3: 'test',
                }),
            undefined,
            `Creating a duplicate record with should throw an error with a uniqueIndex with filter. Make sure syncUniqueIndexes() is actually created the index honoring the filter.`
        )

        await db.createOne(this.collectionName, {
            name: generateId(),
            slug: '555-000-0000',
            someField3: 'test',
        })

        await db.createOne(this.collectionName, {
            name: generateId(),
            slug: '555-000-0001',
            someField3: 'test',
        })

        try {
            await db.syncUniqueIndexes(this.collectionName, [
                {
                    fields: ['uniqueField', 'someField3'],
                    filter: {
                        uniqueField: { $type: 'string' },
                    },
                },
                {
                    fields: ['slug', 'someField3'],
                    filter: {
                        slug: { $type: 'string' },
                    },
                },
            ])
        } catch (err: any) {
            assert.fail(
                `syncUniqueIndexes() should not have thrown an error when syncing multiple unique indexes with filter expressions.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 'test',
            slug: null,
            someField3: 'next',
        })

        try {
            await db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: 'test2',
                slug: null,
                someField3: 'next',
            })
        } catch (err: any) {
            assert.fail(
                `createOne() should not throw since index has filter { slug: { \$type: 'string' } }.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        try {
            await db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: null,
                slug: '555-000-0002',
                someField3: 'next',
            })
        } catch (err: any) {
            assert.fail(
                `createOne() should not throw since index has filter {uniqueField: { \$type: 'string' } }.\n\n` +
                    (err.stack ?? err.message)
            )
        }

        await assert.doesThrowAsync(
            () =>
                db.createOne(this.collectionName, {
                    name: generateId(),
                    uniqueField: null,
                    slug: '555-000-0002',
                    someField3: 'next',
                }),
            undefined,
            `createOne() should throw since index has filter { slug: { \$type: 'string' } }.`
        )

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: undefined,
            slug: '555-000-0004',
            someField3: undefined,
        })

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: undefined,
            slug: '555-000-0003',
            someField3: undefined,
        })

        const name = generateId()
        await db.createOne(this.collectionName, {
            name,
            uniqueField: generateId(),
            slug: undefined,
            someField3: undefined,
        })

        await db.updateOne(
            this.collectionName,
            {
                name,
            },
            {
                someField2: 'hey',
            }
        )

        await this.shutdown(db)
    },

    async assertCanSyncIndexesWithoutPartialThenAgainWithProperlyUpdates(
        connect: TestConnect
    ) {
        const db = await connectToDabatase(connect)

        await db.syncUniqueIndexes(this.collectionName, [
            ['uniqueField', 'someField3'],
        ])

        await db.syncUniqueIndexes(this.collectionName, [
            {
                fields: ['uniqueField', 'someField3'],
                filter: {
                    uniqueField: { $type: 'string' },
                },
            },
        ])

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 1,
            slug: null,
            someField3: 'test',
        })

        try {
            await db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: 1,
                slug: null,
                someField3: 'test',
            })
        } catch {
            assert.fail(
                `An error was thrown trying to create a record that should not have matched on a unique index with a filter. Make sure your database adapter is properly syncing indexes. In this case, it should remove an index without a filter with an index with a filter.`
            )
        }

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 'hey there',
            slug: null,
            someField3: 'how are you?',
        })

        try {
            await assert.doesThrowAsync(() =>
                db.createOne(this.collectionName, {
                    name: generateId(),
                    uniqueField: 'hey there',
                    slug: null,
                    someField3: 'how are you?',
                })
            )
        } catch {
            assert.fail(
                `A record was created that should have been blocked by a unique index with a filter`
            )
        }

        await this.shutdown(db)
    },

    async assertSyncIndexesRemovesExtraIndexes(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.syncIndexes(this.collectionName, [
            ['name'],
            ['someField'],
            ['otherField', 'otherField2'],
        ])
        let indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 3)

        await db.syncIndexes(this.collectionName, [['name']])

        indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 1)
        assert.isEqual(indexes[0].fields[0], 'name')
        await this.shutdown(db)
    },

    async assertSyncIndexesSkipsExisting(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.syncIndexes(this.collectionName, [['name']])

        let indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 1)
        assert.isLength(indexes[0].fields, 1)

        await db.syncIndexes(this.collectionName, [
            ['name'],
            ['someField'],
            ['otherField', 'otherField2'],
        ])

        indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(
            indexes,
            3,
            'There should be 3 indexes after the last sync. 1 would have been skipped, the other 2 should have been added'
        )
        await this.shutdown(db)
    },

    async assertCantDropCompoundIndexThatDoesNotExist(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createIndex(this.collectionName, [
            'someField',
            'someOtherField',
        ])

        const err = await assert.doesThrowAsync(() =>
            db.dropIndex(this.collectionName, ['uniqueField', 'someOtherField'])
        )
        errorAssert.assertError(err, 'INDEX_NOT_FOUND', {
            collectionName: this.collectionName,
            missingIndex: ['someOtherField', 'uniqueField'],
        })
        await this.shutdown(db)
    },

    async assertCanDropCompoundIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createIndex(this.collectionName, ['someField', 'otherField'])
        await db.dropIndex(this.collectionName, ['someField', 'otherField'])

        let indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(
            indexes,
            0,
            `The one index I created should have been dropped`
        )

        await db.createIndex(this.collectionName, ['someField', 'someField2'])
        await db.createIndex(this.collectionName, ['someField', 'someField3'])
        await db.dropIndex(this.collectionName, ['someField', 'someField3'])
        indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(
            indexes,
            1,
            `I created 2 compound indexes, then dropped one, and expected 1 to remain.`
        )
        await this.shutdown(db)
    },

    async assertCanDropIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createIndex(this.collectionName, ['someField'])
        await db.dropIndex(this.collectionName, ['someField'])

        let indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 0)

        await db.createIndex(this.collectionName, ['someField2'])
        await db.createIndex(this.collectionName, ['someField3'])
        await db.dropIndex(this.collectionName, ['someField3'])
        indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 1)
        await this.shutdown(db)
    },

    async assertCanCreateMultiFieldIndex(connect: TestConnect) {
        await this._assertCanCreateMultiFieldIndex(connect, [
            'otherField',
            'someField',
        ])
        await this._assertCanCreateMultiFieldIndex(connect, [
            'someField',
            'otherField',
        ])
        await this._assertCanCreateMultiFieldIndex(connect, [
            'otherField',
            'otherField2',
        ])
        await this._assertCanCreateMultiFieldIndex(connect, [
            'otherField2',
            'otherField',
        ])
    },

    async assertCantCreateSameIndexTwice(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.createIndex(this.collectionName, ['name'])
        let indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(indexes, 1)

        const err = await assert.doesThrowAsync(() =>
            db.createIndex(this.collectionName, ['name'])
        )
        errorAssert.assertError(err, 'INDEX_EXISTS')
        await this.shutdown(db)
    },

    async assertCanCreateIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createIndex(this.collectionName, ['uniqueField'])
        let indexes = await this._getIndexesWith_IdFilteredOut(db)

        assert.isArray(indexes, 'getIndexes() should return an array!')
        assert.isLength(
            indexes,
            1,
            'getIndexes() should return the one index that was created!'
        )
        assert.isLength(
            indexes[0].fields,
            1,
            'getIndexes() should return an array of IndexWithFilter! It should be returing the first index I created with the first field!'
        )
        assert.isEqual(
            indexes[0].fields[0].toLowerCase(),
            'uniqueField'.toLowerCase()
        )

        await db.createIndex(this.collectionName, ['uniqueField2'])
        indexes = await this._getIndexesWith_IdFilteredOut(db)

        assert.isLength(indexes, 2)
        assert.isEqual(
            indexes[1].fields[0].toLowerCase(),
            'uniqueField2'.toLowerCase()
        )

        await db.createIndex(this.collectionName, [
            'uniqueField3',
            'uniqueField4',
        ])
        indexes = await this._getIndexesWith_IdFilteredOut(db)

        assert.isLength(indexes, 3)
        assert.isEqual(
            indexes[2].fields[0].toLowerCase(),
            'uniqueField3'.toLowerCase()
        )
        assert.isEqual(
            indexes[2].fields[1].toLowerCase(),
            'uniqueField4'.toLowerCase()
        )

        await this.shutdown(db)
    },

    async assertHasNoIndexToStart(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const indexes = await db.getIndexes(this.collectionName)

        assert.isLength(indexes, 0)
        await this.shutdown(db)
    },

    async assertNestedFieldIndexUpdates(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        await db.createUniqueIndex(this.collectionName, [
            'target.organizationId',
            'slug',
        ])

        const results = await db.createOne(this.collectionName, {
            target: {
                organizationId: 'go!',
            },
            aNonIndexedField: true,
            name: 'squirrel',
            slug: 'a slug',
        })

        const updated = await db.updateOne(
            this.collectionName,
            { id: results.id },
            {
                target: {
                    organizationId: 'go!',
                },
                aNonIndexedField: false,
                slug: 'a slug',
            }
        )

        assert.isEqual(
            updated.aNonIndexedField ?? updated.anonindexedfield,
            false
        )

        await this.shutdown(db)
    },

    async assertUpsertWithUniqueIndex(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        await db.syncUniqueIndexes(this.collectionName, [
            ['name', 'target.organizationId'],
            ['slug', 'target.organizationId'],
        ])

        const results = await db.createOne(this.collectionName, {
            target: {
                organizationId: 'go!',
            },
            name: 'squirrel',
            slug: 'a slug',
        })

        const updated = await db.upsertOne(
            this.collectionName,
            { target: { organizationId: 'go!' }, slug: 'a slug' },
            {
                target: {
                    organizationId: 'go!',
                },
                name: 'notsquirrel',
                slug: 'a slug',
            }
        )

        assert.isEqual(results.id, updated.id)
        assert.isEqual(updated.name, 'notsquirrel')
        await this.shutdown(db)
    },
    async assertSyncIndexesHandlesRaceConditions(connect: TestConnect) {
        const db = await connectToDabatase(connect)
        const syncs = [
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
            db.syncIndexes(this.collectionName, [
                ['otherField', 'otherField2'],
            ]),
        ]
        await Promise.all(syncs)

        await this.shutdown(db)
    },
    async assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected(
        connect: TestConnect
    ) {
        const db = await connectToDabatase(connect)

        await db.createUniqueIndex(this.collectionName, ['uniqueField'])
        await db.createUniqueIndex(this.collectionName, ['uniqueField2'])

        await db.createOne(this.collectionName, {
            name: generateId(),
            uniqueField: 'unique field 1',
            uniqueField2: 'unique field 2',
        })

        let err = await assert.doesThrowAsync(() =>
            db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: 'unique field 1',
                uniqueField2: 'unique field 2',
            })
        )

        lowerCaseStringArray(err, 'duplicateFields')

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: ['uniquefield'],
            duplicateValues: ['unique field 1'],
            action: 'create',
        })

        err = await assert.doesThrowAsync(() =>
            db.createOne(this.collectionName, {
                name: generateId(),
                uniqueField: 'unique field 1.0',
                uniqueField2: 'unique field 2',
            })
        )

        lowerCaseStringArray(err, 'duplicateFields')

        errorAssert.assertError(err, 'DUPLICATE_RECORD', {
            collectionName: this.collectionName,
            duplicateFields: ['uniquefield2'],
            duplicateValues: ['unique field 2'],
            action: 'create',
        })

        await this.shutdown(db)
    },

    async _assertThrowsExpectedNotFoundOnUpdateOne(
        db: Database,
        query: Record<string, any>
    ) {
        const err = (await assert.doesThrowAsync(
            () => db.updateOne(this.collectionName, query, { name: 'bar' }),
            undefined,
            `updateOne should throw a RECORD_NOT_FOUND when updating a record that cannot be found!`
        )) as SpruceError

        errorAssert.assertError(err, 'RECORD_NOT_FOUND', {
            query,
        })
    },

    async _assert$orReturnsExpectedTotalRecords(
        db: Database,
        $or: Record<string, any>[],
        expected: number
    ) {
        const matches = await db.find(this.collectionName, {
            $or,
        })

        assert.isLength(
            matches,
            expected,
            `Expected to find a specific number of records using $or: ${JSON.stringify($or)}`
        )
    },

    async _assertCanCreateMultiFieldIndex(
        connect: TestConnect,
        fields: string[]
    ) {
        const db = await connectToDabatase(connect)

        await db.createIndex(this.collectionName, fields)
        const indexes = await this._getIndexesWith_IdFilteredOut(db)
        assert.isLength(
            indexes,
            1,
            `getIndexes() should return the index it created. I expected 1 but got ${indexes.length}. Also, make sure you clear the indexes when resetting the database!`
        )

        assert.isEqualDeep(
            indexes[0].fields.map((i) => i.toLowerCase()),
            fields.map((f) => f.toLowerCase())
        )

        await this.shutdown(db)
    },

    async canUpdateNestedField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const locationId = generateId()
        const values = {
            name: 'first',
            target: {
                organizationId: generateId(),
                locationId,
            },
        }

        await db.createOne(this.collectionName, values)

        const newOrganizationId = generateId()
        const updated = await db.updateOne(
            this.collectionName,
            {},
            {
                'target.organizationId': newOrganizationId,
            }
        )

        assert.isEqual(
            updated.target.organizationId,
            newOrganizationId,
            'Could not update nested field target.organizationId using key "target.organizationId"'
        )

        const match = await db.findOne(this.collectionName, { id: updated.id })

        assert.isEqualDeep(
            match!.target,
            {
                organizationId: newOrganizationId,
                locationId,
            },
            `Updating nested field lost existing key 'target.locationId'`
        )

        await this.shutdown(db)
    },

    async canUpsertNestedField(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const locationId = generateId()
        const values = {
            name: 'first',
            target: {
                organizationId: generateId(),
                locationId,
            },
        }

        const record = await db.createOne(this.collectionName, values)

        const newOrganizationId = generateId()

        await db.upsertOne(
            this.collectionName,
            { id: record.id },
            {
                'target.organizationId': newOrganizationId,
            }
        )

        const match = await db.findOne(this.collectionName, { id: record.id })

        assert.isEqual(
            match!.target.organizationId,
            newOrganizationId,
            'Could not find updated record with key "target.organizationId" set'
        )

        assert.isEqual(
            match!.target.locationId,
            locationId,
            `Upserting lost existing key 'target.locationId'`
        )

        await this.shutdown(db)
    },

    async assertUpdateReturnsMatchedCounts(connect: TestConnect) {
        const db = await connectToDabatase(connect)

        const record = await db.createOne(this.collectionName, {
            name: 'first',
        })

        let updated = await db.update(
            this.collectionName,
            { id: record.id },
            {
                name: 'second',
            }
        )

        assert.isEqual(
            updated,
            1,
            'update() should return the number of matched records (in this case 1)'
        )

        updated = await db.update(
            this.collectionName,
            { id: record.id },
            {
                name: 'second',
            }
        )

        assert.isEqual(
            updated,
            1,
            'update() did not return the correct number of matched records (in this case 1)'
        )

        updated = await db.update(
            this.collectionName,
            { name: 'thirty-two' },
            {
                name: 'second',
            }
        )

        assert.isEqual(
            updated,
            0,
            'update() did not return the correct number of matched records on an update (in this case 0).'
        )

        await this.shutdown(db)
    },

    assertHasLowerCaseToCamelCaseMappingEnabled(store: DataStore) {
        assert.isTrue(
            //@ts-ignore
            store.shouldMapLowerCaseToCamelCase,
            `Your data store is not mapping lower case to camel case field names! To make that work, add protected shouldMapLowerCaseToCamelCase = true to your store.`
        )
    },
}

export default databaseAssertUtil

async function assertCantCreateUniqueIndexTwice(
    db: Database,
    collectionName: string,
    fields: string[],
    expectedTotalUniqueIndexes: number
) {
    await db.createUniqueIndex(collectionName, fields)
    let indexes = await db.getUniqueIndexes(collectionName)
    assert.isLength(
        indexes,
        expectedTotalUniqueIndexes,
        'getUniqueIndexes() should return all unique indexes'
    )

    const err = await assert.doesThrowAsync(
        () => db.createUniqueIndex(collectionName, fields),
        undefined,
        'createUniqueIndex() should throw a DataStoreError({code: "INDEX_EXISTS"}) error.'
    )

    errorAssert.assertError(err, 'INDEX_EXISTS', {
        collectionName,
        index: fields,
    })
}

function lowerCaseErrorDuplicateFields(err: Error) {
    lowerCaseStringArray(err, 'duplicateFields')
}

function lowerCaseMissingIndexValues(err: Error) {
    lowerCaseStringArray(err, 'missingIndex')
}

function lowerCaseStringArray(err: Error, key: string) {
    //@ts-ignore
    if (err.options?.[key]?.map) {
        //@ts-ignore
        err.options[key] = err.options[key].map((i: string) => i.toLowerCase())
    }
}
async function connectToDabatase(connect: TestConnect) {
    const { db } = await connect()
    return db
}
