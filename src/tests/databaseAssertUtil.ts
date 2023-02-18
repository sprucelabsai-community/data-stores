import { assert } from '@sprucelabs/test-utils'
import { errorAssert } from '@sprucelabs/test-utils'
import { Connect } from '../__tests__/implementation/Database.test'
import SpruceError from '../errors/SpruceError'
import { Database, Index, UniqueIndex } from '../types/database.types'
import generateId from '../utilities/generateId'

const databaseAssertUtil = {
	collectionName: 'test_collection',
	async getFilteredIndexes(db: Database) {
		return this.filterIdIndex(await db.getIndexes(this.collectionName))
	},
	filterIdIndex(allIndexes: UniqueIndex[] | Index[]) {
		return allIndexes.filter((i) => i[0] !== '_id') as UniqueIndex[] | Index[]
	},
	async _assertUpdateUpdatedRightNumberOfRecords(
		db: Database,
		search: Record<string, any>,
		updates: Record<string, any>,
		expectedUpdateCount: number
	) {
		const updatedCount = await db.update(this.collectionName, search, updates)
		assert.isEqual(updatedCount, expectedUpdateCount)
		const count = await db.count(this.collectionName, updates)
		assert.isEqual(count, expectedUpdateCount)
	},
	async assertCanSortDesc(connect: Connect) {
		const db = await connect()
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
						direction: 'desc',
					},
				],
			}
		)

		assert.isEqual(results[0].name, 'third')
		assert.isEqual(results[1].name, 'second')
		assert.isEqual(results[2].name, 'first')

		const result = await db.findOne(this.collectionName, undefined, {
			sort: [{ field: 'count', direction: 'desc' }],
		})
		assert.isTruthy(result)
		assert.isEqual(result.name, 'third')

		await this.shutdown(db)
	},

	async assertCanSortAsc(connect: Connect) {
		const db = await connect()
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

		assert.isEqual(results[0].name, 'first')
		assert.isEqual(results[1].name, 'second')
		assert.isEqual(results[2].name, 'third')

		const result = await db.findOne(this.collectionName, undefined, {
			sort: [{ field: 'count', direction: 'asc' }],
		})
		assert.isTruthy(result)
		assert.isEqual(result.name, 'first')

		await this.shutdown(db)
	},

	async assertInsertingGeneratesId(connect: Connect) {
		const db = await connect()
		const inserted = await db.createOne(this.collectionName, {
			name: 'first',
		})

		assert.isTruthy(inserted)
		assert.isString(inserted.id)
		assert.isEqual(inserted.name, 'first')

		await this.shutdown(db)
	},

	async assertThrowsWhenUpdatingRecordNotFound(connect: Connect) {
		const db = await connect()
		const err = (await assert.doesThrowAsync(() =>
			db.updateOne('unknown', { id: db.generateId() }, { foo: 'bar' })
		)) as SpruceError

		errorAssert.assertError(err, 'RECORD_NOT_FOUND')

		await this.shutdown(db)
	},

	async shutdown(db: Database) {
		await db.dropDatabase()
		await db.close()
	},

	async assertCanCreateUniqueIndex(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['uniqueField'])
		let indexes = await db.getUniqueIndexes(this.collectionName)

		assert.isLength(indexes, 1)
		assert.isLength(indexes[0], 1)
		assert.isEqual(indexes[0][0], 'uniqueField')

		await db.createUniqueIndex(this.collectionName, ['uniqueField2'])
		indexes = await db.getUniqueIndexes(this.collectionName)

		assert.isLength(indexes, 2)
		assert.isEqual(indexes[1][0], 'uniqueField2')

		await db.createUniqueIndex(this.collectionName, [
			'uniqueField3',
			'uniqueField4',
		])
		indexes = await db.getUniqueIndexes(this.collectionName)

		assert.isLength(indexes, 3)
		assert.isEqual(indexes[2][0], 'uniqueField3')
		assert.isEqual(indexes[2][1], 'uniqueField4')
	},

	async assertHasNoUniqueIndexToStart(connect: Connect) {
		const db = await connect()
		const indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 0)
	},

	async assertCanShutdown(connect: Connect) {
		const db = await connect()
		const id = db.generateId()

		const created = await db.upsertOne(
			this.collectionName,
			{ id },
			{
				id,
				name: 'first',
			}
		)

		assert.isTruthy(created)
		assert.isEqual(created.name, 'first')
		assert.isEqual(created.id, id)

		const upserted = await db.upsertOne(
			this.collectionName,
			{ id },
			{ name: 'second' }
		)

		await db.upsertOne(
			this.collectionName,
			{ id: db.generateId() },
			{ name: 'second' }
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

		await this.shutdown(db)
	},

	async assertCanDeleteOne(connect: Connect) {
		const db = await connect()

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

		assert.isEqual(count, 2)

		await this.shutdown(db)
	},

	async assertCanDeleteRecord(connect: Connect) {
		const db = await connect()
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

		assert.isFalsy(matchedAfterDelete)

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

		assert.isEqual(manyDeleted, 3)

		await this.shutdown(db)
	},

	async assertCanLimitResultsToZero(connect: Connect) {
		const db = await connect()

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

	async assertCanLimitResults(connect: Connect) {
		const db = await connect()

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

	async assertFindOneOnEmptyDatabaseReturnsNull(connect: Connect) {
		const db = await connect()
		const results = await db.findOne(this.collectionName, { id: '111' })
		assert.isFalsy(results)
	},

	async assertEmptyDatabaseReturnsEmptyArray(connect: Connect) {
		const db = await connect()

		const results = await db.find(this.collectionName, { id: '111' })
		assert.isLength(results, 0)
	},

	async assertCanPushOntoArrayValue(connect: Connect) {
		const db = await connect()

		const inserted = await db.createOne(this.collectionName, {
			id: db.generateId(),
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

		const matched = await db.findOne(this.collectionName, { id: updated.id })

		assert.isTruthy(matched)
		assert.isEqualDeep(matched.names, ['first', 'second'])

		await this.shutdown(db)
	},

	async assertCanCreateMany(connect: Connect) {
		const db = await connect()
		const values = [
			{ first: 'ry' },
			{ first: 'tay' },
			{ first: 'bill' },
			{ first: 'bob' },
		]

		const results = await db.create(this.collectionName, values)

		assert.isLength(results, values.length)
		for (const val of values) {
			assert.doesInclude(results, val)
		}

		await this.shutdown(db)
	},

	async assertCanUpdateMany(connect: Connect) {
		const db = await connect()

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

	async assertCanQueryWithOr(connect: Connect) {
		const db = await connect()

		const id1 = generateId()
		const id2 = generateId()

		await db.create(this.collectionName, [
			{
				isPublic: true,
				id: id1,
			},
			{
				id: id2,
			},
		])

		const matches = await db.find(this.collectionName, {
			$or: [{ isPublic: true }, { id: id2 }],
		})

		assert.isLength(matches, 2)
	},

	async assertCanUpdate(connect: Connect) {
		const db = await connect()

		const inserted = await db.createOne(this.collectionName, {
			id: db.generateId(),
			name: 'first',
		})

		assert.isString(inserted.id)
		assert.isEqual(inserted.name, 'first')

		const updated = await db.updateOne(
			this.collectionName,
			{ id: inserted.id },
			{
				name: 'updated',
			}
		)

		assert.isEqual(updated.id, inserted.id)
		assert.isEqual(updated.name, 'updated')

		await this.shutdown(db)
	},

	async assertCanSortById(connect: Connect) {
		const db = await connect()

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

	async assertCanCreateMultiFieldUniqueIndex(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, [
			'uniqueField',
			'uniqueField2',
		])

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
			uniqueField2: 'hello again',
		})

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
			uniqueField2: 'unique',
		})

		let err = (await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, {
				uniqueField: 'hello world',
				uniqueField2: 'unique',
			})
		)) as SpruceError

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField', 'uniqueField2'],
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
				uniqueField: 'hello world',
				uniqueField2: 'unique2',
			}
		)

		err = (await assert.doesThrowAsync(() =>
			db.upsertOne(
				this.collectionName,
				{
					uniqueField: 'hello world',
					uniqueField2: 'unique2',
				},
				{
					uniqueField: 'hello world',
					uniqueField2: 'hello again',
				}
			)
		)) as SpruceError

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField', 'uniqueField2'],
			duplicateValues: ['hello world', 'hello again'],
			action: 'upsertOne',
		})

		await this.shutdown(db)
	},

	async assertSettingUniqueIndexViolationThrowsSpruceError(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['randomUniqueField'])

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
			randomUniqueField: '1',
		})

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
			randomUniqueField: '2',
		})

		let err = await assert.doesThrowAsync(() =>
			db.syncUniqueIndexes(this.collectionName, [['uniqueField']])
		)

		assert.isTrue(err instanceof SpruceError)
		errorAssert.assertError(err, 'DUPLICATE_KEY')
	},

	async assertDuplicateKeyThrowsOnInsert(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['uniqueField'])

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
		})

		let err = await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, { uniqueField: 'hello world' })
		)

		assert.isTrue(err instanceof SpruceError)
	},

	async assertSyncingIndexesDoesNotAddAndRemove(connect: Connect) {
		const db = await connect()

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
	},

	async assertSyncingUniqueIndexesRemovesExtraIndexes(connect: Connect) {
		const db = await connect()
		await db.syncUniqueIndexes(this.collectionName, [
			['uniqueField'],
			['someField'],
			['otherField', 'otherField2'],
		])
		let indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 3)

		await db.syncUniqueIndexes(this.collectionName, [['uniqueField']])

		indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)
		assert.isEqual(indexes[0][0], 'uniqueField')
	},

	async assertSyncingUniqueIndexsSkipsExistingIndexs(connect: Connect) {
		const db = await connect()
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
	},

	async assertSyncingUniqueIndexsAddsMissingIndexes(connect: Connect) {
		const db = await connect()
		await db.syncUniqueIndexes(this.collectionName, [['uniqueField']])

		let indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)

		await db.syncUniqueIndexes(this.collectionName, [['someField']])

		indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)

		await db.syncUniqueIndexes(this.collectionName, [
			['uniqueField'],
			['someField'],
		])

		indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 2)
	},

	async assertCantDropCompoundUniqueIndexThatDoesntExist(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, [
			'someField',
			'someOtherField',
		])

		const err = await assert.doesThrowAsync(() =>
			db.dropIndex(this.collectionName, ['uniqueField', 'someOtherField'])
		)
		errorAssert.assertError(err, 'INDEX_NOT_FOUND')
	},

	async assertCantDropIndexWhenNoIndexExists(connect: Connect) {
		const db = await connect()

		const err = await assert.doesThrowAsync(() =>
			db.dropIndex(this.collectionName, ['someOtherField'])
		)
		errorAssert.assertError(err, 'INDEX_NOT_FOUND')
	},

	async assertCantDropUniqueIndexThatDoesntExist(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['someField'])

		const err = await assert.doesThrowAsync(() =>
			db.dropIndex(this.collectionName, ['someOtherField'])
		)
		errorAssert.assertError(err, 'INDEX_NOT_FOUND')
	},

	async assertCanDropCompoundUniqueIndex(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['someField', 'otherField'])
		await db.dropIndex(this.collectionName, ['someField', 'otherField'])

		let indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 0)

		await db.createUniqueIndex(this.collectionName, ['someField', 'someField2'])
		await db.createUniqueIndex(this.collectionName, ['someField', 'someField3'])
		await db.dropIndex(this.collectionName, ['someField', 'someField3'])
		indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)
	},

	async assertCanDropUniqueIndex(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['someField'])
		await db.dropIndex(this.collectionName, ['someField'])

		let indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 0)

		await db.createUniqueIndex(this.collectionName, ['someField2'])
		await db.createUniqueIndex(this.collectionName, ['someField3'])
		await db.dropIndex(this.collectionName, ['someField3'])
		indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)
	},

	async assertCantCreateUniqueIndexTwice(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['uniqueField'])
		let indexes = await db.getUniqueIndexes(this.collectionName)
		assert.isLength(indexes, 1)

		const err = await assert.doesThrowAsync(() =>
			db.createUniqueIndex(this.collectionName, ['uniqueField'])
		)
		errorAssert.assertError(err, 'INDEX_EXISTS')
	},
	async assertSyncingUniqueIndexesIsRaceProof(connect: Connect) {
		const db = await connect()
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
	},
	async assertUniqueIndexBlocksDuplicates(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, ['uniqueField'])

		await db.createOne(this.collectionName, {
			uniqueField: 'hello world',
		})

		let err = (await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, { uniqueField: 'hello world' })
		)) as SpruceError

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField'],
			duplicateValues: ['hello world'],
			action: 'create',
		})

		const created = await db.createOne(this.collectionName, {
			uniqueField: 'pass',
		})

		err = (await assert.doesThrowAsync(() =>
			db.updateOne(
				this.collectionName,
				{ id: created.id },
				{ uniqueField: 'hello world' }
			)
		)) as SpruceError

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField'],
			duplicateValues: ['hello world'],
			action: 'updateOne',
		})

		let promises: Promise<any>[] = []
		for (let c = 0; c <= 10; c++) {
			promises.push(
				db.createOne(this.collectionName, {
					uniqueField: 'fast',
				})
			)
		}

		err = (await assert.doesThrowAsync(() =>
			Promise.all(promises)
		)) as SpruceError

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			duplicateFields: ['uniqueField'],
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

	async assertCanCreateUniqueIndexOnNestedField(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, [
			'target.organizationId',
			'slug',
		])

		await db.createOne(this.collectionName, {
			target: {
				organizationId: 'go!',
				locationId: null,
			},
			slug: 'a slug',
		})

		const err = await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, {
				target: {
					organizationId: 'go!',
					locationId: null,
				},
				slug: 'a slug',
			})
		)

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['target.organizationId', 'slug'],
			duplicateValues: ['go!', 'a slug'],
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
				target: {
					organizationId: 'go 2!',
					locationId: null,
				},
				slug: 'a slug',
			}
		)
	},

	async assertCanPushToArrayOnUpsert(connect: Connect) {
		const db = await connect()
		const record = await db.createOne(this.collectionName, { names: [] })
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
	},

	async assertCanSearchByRegex(connect: Connect) {
		const db = await connect()

		await db.create(this.collectionName, [
			{
				name: 'first',
				subObject: {
					score: 1,
				},
			},
			{
				name: 'second',
				subObject: {
					score: 2,
				},
			},
			{
				name: 'third',
				subObject: {
					score: 2,
				},
			},
		])

		const all = await db.find(
			this.collectionName,
			{ name: { $regex: /fi/ } },
			{ includeFields: ['name'] }
		)
		assert.isEqualDeep(all, [
			{
				name: 'first',
			},
		])
	},

	async assertCanReturnOnlySelectFields(connect: Connect) {
		const db = await connect()

		await db.create(this.collectionName, [
			{
				name: 'first',
				subObject: {
					score: 1,
				},
			},
			{
				name: 'second',
				subObject: {
					score: 2,
				},
			},
			{
				name: 'third',
				subObject: {
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
			{ includeFields: ['subObject'] }
		)

		assert.isEqualDeep(first, {
			subObject: {
				score: 1,
			},
		})
	},

	async assertThrowsWithoutDatabaseName(connect: Connect) {
		const err = await assert.doesThrowAsync(() =>
			connect(undefined, 'undefined')
		)
		errorAssert.assertError(err, 'INVALID_DATABASE_NAME', {
			suppliedName: 'undefined',
		})
	},

	async assertThrowsWhenCantConnect(connect: Connect) {
		const err = await assert.doesThrowAsync(() =>
			connect('mongodb://localhost:9999')
		)
		errorAssert.assertError(err, 'UNABLE_TO_CONNECT_TO_DB')
	},

	async assertThrowsWithInvalidConnectionString(connect: Connect) {
		const err = await assert.doesThrowAsync(() => connect('astnoehusantoheun'))
		errorAssert.assertError(err, 'INVALID_DB_CONNECTION_STRING')
	},

	async assertKnowsIfConnectionClosed(connect: Connect) {
		const db = await connect()
		assert.isTrue(db.isConnected())

		await db.close()

		assert.isFalse(db.isConnected())
	},

	async assertCanQueryPathWithDotSyntax(connect: Connect) {
		const db = await connect()

		await db.create(this.collectionName, [
			{
				name: 'first',
				subObject: {
					score: 1,
				},
			},
			{
				name: 'second',
				subObject: {
					score: 2,
				},
			},
			{
				name: 'third',
				subObject: {
					score: 2,
				},
			},
		])

		const secondMatch = await db.findOne(this.collectionName, {
			'subObject.score': 2,
		})

		assert.isTruthy(secondMatch)
		assert.isEqual(secondMatch.name, 'second')

		await this.shutdown(db)
	},

	async assertCanQueryByGtLtGteLte(connect: Connect) {
		const db = await connect()

		const created = await db.create(this.collectionName, [
			{
				position: 1,
			},
			{
				position: 2,
			},
			{
				position: 3,
			},
			{
				position: 4,
			},
		])

		const gtMatches = await db.find(this.collectionName, {
			id: { $gt: created[2].id },
		})

		assert.isLength(gtMatches, 1)
		assert.isEqual(gtMatches[0].position, 4)

		const gteMatches = await db.find(this.collectionName, {
			id: { $gte: created[2].id },
		})

		assert.isLength(gteMatches, 2)
		assert.isEqual(gteMatches[0].position, 3)
		assert.isEqual(gteMatches[1].position, 4)

		const ltMatches = await db.find(this.collectionName, {
			id: { $lt: created[2].id },
		})

		assert.isLength(ltMatches, 2)
		assert.isEqual(ltMatches[0].position, 1)
		assert.isEqual(ltMatches[1].position, 2)

		const lteMatches = await db.find(this.collectionName, {
			id: { $lte: created[2].id },
		})

		assert.isLength(lteMatches, 3)
		assert.isEqual(lteMatches[0].position, 1)
		assert.isEqual(lteMatches[1].position, 2)
		assert.isEqual(lteMatches[2].position, 3)

		await this.shutdown(db)
	},

	async assertCanFindWithNe(connect: Connect) {
		const db = await connect()

		const record1 = await db.createOne(this.collectionName, {
			foo: 'bar',
			hello: 'world',
		})

		await db.createOne(this.collectionName, {
			foo: 'bar2',
			hello: 'world',
		})

		await db.createOne(this.collectionName, {
			foo: 'bar3',
			hello: 'planet',
		})

		const query = { id: { $ne: record1.id } }
		const results = await db.find(this.collectionName, query)

		assert.isLength(results, 2)

		await this.shutdown(db)
	},

	async assertCanFindWithIn(connect: Connect) {
		const db = await connect()

		const record1 = await db.createOne(this.collectionName, {
			foo: 'bar',
			hello: 'world',
		})

		const record2 = await db.createOne(this.collectionName, {
			foo: 'bar2',
			hello: 'world',
		})

		const record3 = await db.createOne(this.collectionName, {
			foo: 'bar3',
			hello: 'planet',
		})

		const query = { id: { $in: [record1.id, record2.id, record3.id] } }
		const results = await db.find(this.collectionName, query)

		assert.isLength(results, 3)

		await this.shutdown(db)
	},

	async assertCanCountOnId(connect: Connect) {
		const db = await connect()

		const first = await db.createOne(this.collectionName, {
			foo: 'bar',
			hello: 'world',
		})
		const second = await db.createOne(this.collectionName, {
			foo: 'bar2',
			hello: 'world',
		})
		const third = await db.createOne(this.collectionName, {
			foo: 'bar3',
			hello: 'planet',
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

	async assertCanCount(connect: Connect) {
		const db = await connect()

		await db.createOne(this.collectionName, { foo: 'bar', hello: 'world' })
		await db.createOne(this.collectionName, { foo: 'bar2', hello: 'world' })
		await db.createOne(this.collectionName, { foo: 'bar3', hello: 'planet' })

		const countAll = await db.count(this.collectionName)

		assert.isEqual(countAll, 3)

		await this.shutdown(db)
	},

	async assertCanUpsertNull(connect: Connect) {
		const db = await connect()

		const createdUndefined = await db.upsertOne(
			this.collectionName,
			{
				undefinedField: undefined,
			},
			{
				undefinedField: undefined,
			}
		)

		assert.isTruthy(createdUndefined)
		assert.isNull(createdUndefined.undefinedField)

		const createdNull = await db.upsertOne(
			this.collectionName,
			{
				nullField: null,
			},
			{
				nullField: null,
			}
		)

		assert.isTruthy(createdNull)

		let all = await db.find(this.collectionName)

		assert.isLength(all, 2)

		const updatedUndefined = await db.upsertOne(
			this.collectionName,
			{
				undefinedField: undefined,
			},
			{ undefinedField: 'now defined' }
		)

		assert.isEqual(updatedUndefined.id, createdUndefined.id)
		assert.isEqual(updatedUndefined.undefinedField, 'now defined')

		const updatedNull = await db.upsertOne(
			this.collectionName,
			{
				nullField: null,
			},
			{ nullField: 'now defined' }
		)

		assert.isEqual(updatedNull.id, createdNull.id)
		assert.isEqual(updatedNull.nullField, 'now defined')

		all = await db.find(this.collectionName)

		assert.isLength(all, 2)

		await this.shutdown(db)
	},

	async assertCanSaveAndGetNullAndUndefined(connect: Connect) {
		const db = await connect()
		const created = await db.createOne(this.collectionName, {
			undefinedField: undefined,
			nullField: null,
		})

		assert.isNull(created.undefinedField)
		assert.isNull(created.nullField)

		const matchedUndefined = await db.findOne(this.collectionName, {
			undefinedField: undefined,
		})

		assert.isTruthy(matchedUndefined)
		assert.isNull(matchedUndefined.undefinedField)

		const matchedNull = await db.findOne(this.collectionName, {
			nullField: null,
		})

		assert.isTruthy(matchedNull)
		assert.isNull(matchedNull.nullField)

		const updatedUndefined = await db.updateOne(
			this.collectionName,
			{
				undefinedField: undefined,
			},
			{ undefinedField: 'now defined' }
		)

		assert.isEqual(updatedUndefined.id, created.id)
		assert.isEqual(updatedUndefined.undefinedField, 'now defined')

		const updatedNull = await db.updateOne(
			this.collectionName,
			{
				nullField: null,
			},
			{ nullField: 'now defined' }
		)

		assert.isEqual(updatedNull.nullField, 'now defined')

		await this.shutdown(db)
	},

	async assertSyncIndexesDoesNotRemoveExisting(connect: Connect) {
		const db = await connect()

		await db.createIndex(this.collectionName, ['otherField'])
		await db.createIndex(this.collectionName, ['someField'])

		db.createIndex = () => {
			throw new Error('Should not have been called')
		}
		db.dropIndex = () => {
			throw new Error('Should not have been called')
		}

		await db.syncIndexes(this.collectionName, [['someField'], ['otherField']])
	},

	async assertSyncIndexesRemovesExtraIndexes(connect: Connect) {
		const db = await connect()
		await db.syncIndexes(this.collectionName, [
			['field'],
			['someField'],
			['otherField', 'otherField2'],
		])
		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 3)

		await db.syncIndexes(this.collectionName, [['field']])

		indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)
		assert.isEqual(indexes[0][0], 'field')
	},

	async assertSyncIndexesSkipsExisting(connect: Connect) {
		const db = await connect()
		await db.syncIndexes(this.collectionName, [['field']])

		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)

		await db.syncIndexes(this.collectionName, [
			['field'],
			['someField'],
			['otherField', 'otherField2'],
		])

		indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 3)
	},

	async assertCantDropCompoundIndexThatDoesNotExist(connect: Connect) {
		const db = await connect()
		await db.createIndex(this.collectionName, ['someField', 'someOtherField'])

		const err = await assert.doesThrowAsync(() =>
			db.dropIndex(this.collectionName, ['uniqueField', 'someOtherField'])
		)
		errorAssert.assertError(err, 'INDEX_NOT_FOUND')
	},

	async assertCanDropCompoundIndex(connect: Connect) {
		const db = await connect()
		await db.createIndex(this.collectionName, ['someField', 'otherField'])
		await db.dropIndex(this.collectionName, ['someField', 'otherField'])

		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 0)

		await db.createIndex(this.collectionName, ['someField', 'someField2'])
		await db.createIndex(this.collectionName, ['someField', 'someField3'])
		await db.dropIndex(this.collectionName, ['someField', 'someField3'])
		indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)
	},

	async assertCanDropIndex(connect: Connect) {
		const db = await connect()
		await db.createIndex(this.collectionName, ['someField'])
		await db.dropIndex(this.collectionName, ['someField'])

		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 0)

		await db.createIndex(this.collectionName, ['someField2'])
		await db.createIndex(this.collectionName, ['someField3'])
		await db.dropIndex(this.collectionName, ['someField3'])
		indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)
	},

	async assertCanCreateMultiFieldIndex(connect: Connect, fields: any) {
		const db = await connect()
		await db.createIndex(this.collectionName, fields)
		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)

		assert.isEqualDeep(indexes, [fields])
	},

	async assertCantCreateSameIndexTwice(connect: Connect) {
		const db = await connect()
		await db.createIndex(this.collectionName, ['field'])
		let indexes = await this.getFilteredIndexes(db)
		assert.isLength(indexes, 1)

		const err = await assert.doesThrowAsync(() =>
			db.createIndex(this.collectionName, ['field'])
		)
		errorAssert.assertError(err, 'INDEX_EXISTS')
	},

	async assertCanCreateIndex(connect: Connect) {
		const db = await connect()
		await db.createIndex(this.collectionName, ['field'])
		let indexes = await this.getFilteredIndexes(db)

		assert.isLength(indexes, 1)
		assert.isLength(indexes[0], 1)
		assert.isEqual(indexes[0][0], 'field')

		await db.createIndex(this.collectionName, ['field2'])
		indexes = await this.getFilteredIndexes(db)

		assert.isLength(indexes, 2)
		assert.isEqual(indexes[1][0], 'field2')

		await db.createIndex(this.collectionName, ['field3', 'field4'])
		indexes = await this.getFilteredIndexes(db)

		assert.isLength(indexes, 3)
		assert.isEqual(indexes[2][0], 'field3')
		assert.isEqual(indexes[2][1], 'field4')
	},

	async assertHasNoIndexToStart(connect: Connect) {
		const db = await connect()

		const indexes = await db.getIndexes(this.collectionName)

		assert.isLength(indexes, 0)
	},

	async assertNestedFieldIndexUpdates(connect: Connect) {
		const db = await connect()
		await db.createUniqueIndex(this.collectionName, [
			'target.organizationId',
			'slug',
		])

		const results = await db.createOne(this.collectionName, {
			target: {
				organizationId: 'go!',
			},
			aNonIndexedField: true,
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

		assert.isEqual(updated.aNonIndexedField, false)
	},

	async assertUpsertWithUniqueIndex(connect: Connect) {
		const db = await connect()

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
	},
	async assertSyncIndexesHandlesRaceConditions(connect: Connect) {
		const db = await connect()
		const syncs = [
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
			db.syncIndexes(this.collectionName, [['otherField', 'otherField2']]),
		]
		await Promise.all(syncs)
	},
	async assertDuplicateFieldsWithMultipleUniqueIndexesWorkAsExpected(
		connect: Connect
	) {
		const db = await connect()

		await db.createUniqueIndex(this.collectionName, ['uniqueField1'])
		await db.createUniqueIndex(this.collectionName, ['uniqueField2'])

		await db.createOne(this.collectionName, {
			uniqueField1: 'unique field 1',
			uniqueField2: 'unique field 2',
		})

		let err = await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, {
				uniqueField1: 'unique field 1',
				uniqueField2: 'unique field 2',
			})
		)

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField1'],
			duplicateValues: ['unique field 1'],
			action: 'create',
		})

		err = await assert.doesThrowAsync(() =>
			db.createOne(this.collectionName, {
				uniqueField1: 'unique field 1.0',
				uniqueField2: 'unique field 2',
			})
		)

		errorAssert.assertError(err, 'DUPLICATE_RECORD', {
			collectionName: this.collectionName,
			duplicateFields: ['uniqueField2'],
			duplicateValues: ['unique field 2'],
			action: 'create',
		})

		await this.shutdown(db)
	},
}

export default databaseAssertUtil
