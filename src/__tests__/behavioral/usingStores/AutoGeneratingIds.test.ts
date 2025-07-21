import { Schema } from '@sprucelabs/schema'
import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import AbstractStore from '../../../stores/AbstractStore'
import { StoreName } from '../../../types/stores.types'
import AbstractStoreTest from './support/AbstractStoreTest'
import CustomPrimaryStore from './support/CustomPrimaryStore'
import CustomPrimaryStore2 from './support/CustomPrimaryStore2'

@suite()
export default class AutoGeneratingIdsTest extends AbstractStoreTest {
    protected async beforeEach() {
        await super.beforeEach()
        this.stores.setStoreClass('customPrimary', CustomPrimaryStore)
        this.stores.setStoreClass('customPrimary2', CustomPrimaryStore2)
    }

    @test()
    protected async doesNotAutoPopulateIdIfDbReturnsFalseFromShouldAutoGenerateId() {
        await this.assertDoesNotGeneratePrimaryField(
            'customPrimary',
            'customId1'
        )
    }

    @test()
    protected async doesNotAutoGenerateIdWithDifferentName() {
        await this.assertDoesNotGeneratePrimaryField(
            'customPrimary2',
            'anotherCustomId'
        )
    }

    @test('can pass own custom id 1', 'customPrimary', 'customId1')
    @test('can pass own custom id 2', 'customPrimary2', 'anotherCustomId')
    protected async canPassOwnCustomId(
        storeName: StoreName,
        primaryFieldName: string
    ) {
        const store = await this.stores.getStore(storeName)
        const id = generateId()
        this.disableAutoIdGeneration(store as AbstractStore<Schema>)

        //@ts-ignore
        store.willCreate = async (values) => {
            return {
                ...values,
                [primaryFieldName]: id,
            }
        }

        //@ts-ignore
        await store.createOne({
            name: generateId(),
        })

        //@ts-ignore
        const match = await store.findOne({ [primaryFieldName]: id })
        assert.isTruthy(match)
    }

    private async assertDoesNotGeneratePrimaryField(
        storeName: StoreName,
        fieldName: string
    ) {
        const store = (await this.stores.getStore(
            storeName
        )) as AbstractStore<Schema>
        const db = this.disableAutoIdGeneration(store)

        //@ts-ignore
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

    private disableAutoIdGeneration(store: AbstractStore<Schema>) {
        const db = store.getDb()
        db.getShouldAutoGenerateId = () => false
        return db
    }
}
