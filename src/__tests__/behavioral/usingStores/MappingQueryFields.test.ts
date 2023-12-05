import { assert, generateId, test } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import StoreWithDifferentDatabaseSchema from './support/DifferentDatabaseSchemaStore'

export default class MappingQueryFieldsTest extends AbstractStoreTest {
	@test()
	protected static async canCreateAndQueryAgainstId() {
		this.stores.setStoreClass(
			'differentDatabaseSchema',
			StoreWithDifferentDatabaseSchema
		)

		const store = await this.stores.getStore('differentDatabaseSchema')
		const created = await store.createOne({
			serialNumber: generateId(),
		})

		const found = await store.findOne({
			id: created.id,
		})

		assert.isEqualDeep(found, created)
	}
}
