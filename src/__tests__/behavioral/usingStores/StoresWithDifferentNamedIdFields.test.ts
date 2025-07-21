import { test, suite, assert, generateId } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import CustomPrimaryStore from './support/CustomPrimaryStore'
import CustomPrimaryStore2 from './support/CustomPrimaryStore2'
import CustomPrimaryStoreWithFieldNamedId from './support/CustomPrimaryWithFieldNamedId'

@suite()
export default class StoresWithDifferentNamedIdFieldsTest extends AbstractStoreTest {
    private customPrimaryStoreWithFieldNamedId!: CustomPrimaryStoreWithFieldNamedId
    private customPrimaryStore!: CustomPrimaryStore
    private customPrimaryStore2!: CustomPrimaryStore2

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.stores.setStoreClass('customPrimary', CustomPrimaryStore)
        this.stores.setStoreClass('customPrimary2', CustomPrimaryStore2)
        this.stores.setStoreClass(
            'customPrimaryWithFieldNamedId',
            CustomPrimaryStoreWithFieldNamedId
        )

        this.customPrimaryStore = await this.stores.getStore('customPrimary')
        this.customPrimaryStore2 = await this.stores.getStore('customPrimary2')
        this.customPrimaryStoreWithFieldNamedId = await this.stores.getStore(
            'customPrimaryWithFieldNamedId'
        )
    }

    @test()
    protected async canSaveRecordWithDifferentId1() {
        const created = await this.createOne()
        assert.isTruthy(created.customId1)
        //@ts-ignore
        assert.isFalsy(created.id)
    }

    @test()
    protected async canUpdateRecordWithDifferentId1() {
        const created = await this.createOne()
        const updated = await this.customPrimaryStore.updateOne(
            {
                customId1: created.customId1,
            },
            {
                name: generateId(),
            }
        )

        //@ts-ignore
        assert.isFalsy(updated.id)
    }

    @test()
    protected async canCreateManyWithCustomId() {
        await this.customPrimaryStore.create([
            this.generateValues(),
            this.generateValues(),
        ])
    }

    @test()
    protected async canUpsertWithCustomId() {
        const created = await this.createOne()
        const upserted = await this.customPrimaryStore.upsertOne(
            {
                customId1: created.customId1,
            },
            {
                name: generateId(),
            }
        )
        assert.isTruthy(upserted.customId1)
        assert.isEqual(upserted.customId1, created.customId1)
    }

    @test()
    protected async canSaveRecordWithDifferentId2() {
        const created = await this.customPrimaryStore2.createOne(
            this.generateValues()
        )

        assert.isTruthy(created.anotherCustomId)
        //@ts-ignore
        assert.isFalsy(created.id)
    }

    @test()
    protected async canSaveWithDifferentIdEvenIfHasFieldNamedId() {
        const created = await this.customPrimaryStoreWithFieldNamedId.createOne(
            this.generateValues()
        )

        assert.isFalsy(created.id)
    }

    @test()
    protected async passesPrimaryKeysToFind() {
        this.customPrimaryStore.getDb().find = async (
            _collectionName: string,
            _query: Record<string, any>,
            _options: any,
            dbOptions: any
        ) => {
            assert.isTruthy(dbOptions)
            assert.isEqualDeep(dbOptions.primaryFieldNames, ['customId1'])
            return []
        }

        await this.customPrimaryStore.find({})
    }

    private async createOne() {
        return await this.customPrimaryStore.createOne(this.generateValues())
    }

    private generateValues() {
        return {
            name: generateId(),
        }
    }
}
