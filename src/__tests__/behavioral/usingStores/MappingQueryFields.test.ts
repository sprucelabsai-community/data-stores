import { assert, generateId, test } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import StoreWithDifferentDatabaseSchema from './support/DifferentDatabaseSchemaStore'

export default class MappingQueryFieldsTest extends AbstractStoreTest {
	private static store: StoreWithDifferentDatabaseSchema
	protected static async beforeEach(): Promise<void> {
		await super.beforeEach()
		this.stores.setStoreClass(
			'differentDatabaseSchema',
			StoreWithDifferentDatabaseSchema
		)
		this.store = await this.stores.getStore('differentDatabaseSchema')
	}

	@test()
	protected static async canCreateAndQueryAgainstId() {
		const created = await this.createOne()
		const found = await this.findOne(created.id)

		assert.isEqualDeep(found, created)
	}

	@test()
	protected static async canDeleteOneMappingField() {
		const created = await this.createOne()

		const count = await this.store.deleteOne({
			id: created.id,
		})

		assert.isEqual(count, 1)
		await this.assertRecordDeleted(created.id)
	}

	@test()
	protected static async canDeleteManyMappingField() {
		const created = await this.createOne()

		const count = await this.store.delete({
			id: created.id,
		})

		assert.isEqual(count, 1)
		await this.assertRecordDeleted(created.id)
	}

	@test()
	protected static async canUpdateOneMappingField() {
		const created = await this.createOne()

		const serialNumber = generateId()
		await this.store.updateOne(
			{
				id: created.id,
			},
			{
				serialNumber,
			}
		)

		const found = await this.findOne(created.id)
		assert.isEqual(found?.serialNumber, serialNumber)
	}

	@test.skip('have to figure out how to dig willUpdate fired for each record')
	protected static async canUpdateManyMappingField() {
		const created = await this.createOne()

		const serialNumber = generateId()
		await this.store.update(
			{
				id: created.id,
			},
			{
				serialNumber,
			}
		)

		const found = await this.findOne(created.id)
		assert.isEqual(found?.serialNumber, serialNumber)
	}

	private static async assertRecordDeleted(id: string) {
		const found = await this.findOne(id)
		assert.isNull(found)
	}

	private static async findOne(id: string) {
		return await this.store.findOne({
			id,
		})
	}

	private static async createOne() {
		return await this.store.createOne({
			serialNumber: generateId(),
		})
	}
}
