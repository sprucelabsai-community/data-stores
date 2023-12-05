import { Schema } from '@sprucelabs/schema'
import { test, assert, generateId } from '@sprucelabs/test-utils'
import AbstractStore from '../../../stores/AbstractStore'
import { StoreName } from '../../../types/stores.types'
import AbstractStoreTest from './support/AbstractStoreTest'
import CustomPrimaryStore from './support/CustomPrimaryStore'
import CustomPrimaryStore2 from './support/CustomPrimaryStore2'

export default class AutoGeneratingIdsTest extends AbstractStoreTest {
	protected static async beforeEach() {
		await super.beforeEach()
		this.stores.setStoreClass('customPrimary', CustomPrimaryStore)
		this.stores.setStoreClass('customPrimary2', CustomPrimaryStore2)
	}

	@test()
	protected static async doesNotAutoPopulateIdIfDbReturnsFalseFromShouldAutoGenerateId() {
		await this.assertDoesNotGeneratePrimaryField('customPrimary', 'customId1')
	}

	@test()
	protected static async doesNotAutoGenerateIdWithDifferentName() {
		await this.assertDoesNotGeneratePrimaryField(
			'customPrimary2',
			'anotherCustomId'
		)
	}

	private static async assertDoesNotGeneratePrimaryField(
		storeName: StoreName,
		fieldName: string
	) {
		const store = (await this.stores.getStore(
			storeName
		)) as AbstractStore<Schema>
		const db = store.getDb()
		db.getShouldAutoGenerateId = () => false
		db.createOne = async (_collectionName, values) => {
			assert.isFalsy(values[fieldName])
			return {
				[fieldName]: generateId(),
				name: values.name,
			}
		}

		await store.createOne({
			name: generateId(),
		})
	}
}
