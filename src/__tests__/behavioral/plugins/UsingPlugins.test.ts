import {
    test,
    suite,
    assert,
    generateId,
    errorAssert,
} from '@sprucelabs/test-utils'
import { SpyRecord } from '../usingStores/support/SpyStore'
import AbstractPluginTest from './AbstractPluginTest'
import MockPlugin from './MockPlugin'

@suite()
export default class UsingPluginsTest extends AbstractPluginTest {
    private plugin!: MockPlugin
    private collectionName!: string

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()

        this.collectionName = generateId()
        this.plugin = this.addNewPlugin()
        this.spyStore.setCollectionName(this.collectionName)
    }

    @test()
    protected async didCreateOneGetsExpectedParams() {
        const { created } = await this.createOne()
        this.plugin.assertDidCreateOneParameters(created)
    }

    @test()
    protected async handlesMultiplePluginsOnDidCreateOne() {
        const plugin = this.addNewPlugin()
        const { created } = await this.createOne()
        plugin.assertDidCreateOneParameters(created)
    }

    @test()
    protected async willCreateOneGetsExpectedParams() {
        const { values } = await this.createOne()
        this.plugin.assertWillCreateOneParameters(values)
    }

    @test()
    protected async handlesMultiplePluginsOnWillCreateOne() {
        const plugin = this.addNewPlugin()
        const { values } = await this.createOne()
        plugin.assertWillCreateOneParameters(values)
    }

    @test()
    protected async pluginsGetTheLastPluginsNewValues() {
        const expected = {
            hello: 'worlds',
        }
        this.setNewValuesWillCreateOne(expected)
        const plugin = this.addNewPlugin()
        await this.createOne()
        plugin.assertWillCreateOneParameters(expected)
    }

    @test()
    protected async canMixinValuesNotInSchemaToSave() {
        const values = {
            test: generateId(),
            world: generateId(),
        }
        this.setValuesToMixinBeforeCreate(values)
        await this.createOne()
        await this.assertFirstSaveIncludes(values)
    }

    @test()
    protected async canOverrideFirstPrimaryKeyWithNumber() {
        const values = {
            id: 1,
        }
        this.setValuesToMixinBeforeCreate(values)
        await this.createOne()
        await this.assertFirstSaveIncludes(values)
    }

    @test()
    protected async mixesInMultipleWillCreateValues() {
        const values = {
            taco: generateId(),
            bravo: generateId(),
        }

        this.plugin.setValuesToMixinBeforeCreate(values)

        const plugin = this.addNewPlugin()
        const values2 = {
            cheesy: generateId(),
            burritor: generateId(),
        }

        plugin.setValuesToMixinBeforeCreate(values2)

        await this.createOne()
        await this.assertFirstSaveIncludes({ ...values, ...values2 })
    }

    @test()
    protected async updateOneGetsExpectedParams() {
        const { query, updates } = await this.randomlyUpdateOne()
        this.plugin.assertWillUpdateOneParameters(query, updates)
    }

    @test()
    protected async handlesMultiplePluginsOnUpdateOne() {
        const plugin = this.addNewPlugin()
        const { query, updates } = await this.randomlyUpdateOne()
        plugin.assertWillUpdateOneParameters(query, updates)
    }

    @test('can mixin values to return on create one 1', {
        cheesy: 'burrito',
    })
    @test('can mixin values to return on create one 2', {
        taco: 'bravo',
    })
    protected async pluginCanMixinValuesToReturnOnWillCreateOne(
        values: Record<string, any>
    ) {
        this.plugin.setValuesToMixinAfterCreate(values)

        const { created } = await this.createOne()

        assert.doesInclude(created, values)
    }

    @test()
    protected async multiplePluginsCanMixinValuesToReturnOnCreateOne() {
        const values1 = {
            what: 'the?',
        }
        this.plugin.setValuesToMixinAfterCreate(values1)

        const plugin = this.addNewPlugin()

        const values2 = {
            easy: 'peasy',
        }

        plugin.setValuesToMixinAfterCreate(values2)

        const { created } = await this.createOne()

        assert.doesInclude(created, {
            ...values1,
            ...values2,
        })
    }

    @test()
    protected async mixinAfterCreateActuallyHappensAfterCreate() {
        const values = this.generateRandomSpyValues()

        this.db.createOne = async () => values
        await this.createOne()

        this.plugin.assertDidCreateOneParameters(values)
    }

    @test()
    protected async pluginCanModifyQueryOnUpdateOne() {
        this.plugin.setQueryToReturnOnWillUpdateOne({
            firstName: 'Tay',
        })

        const { created: created1 } = await this.createOne({
            firstName: 'Tay',
        })

        const { created: created2 } = await this.createOne({
            firstName: 'Eric',
            extraField: generateId(),
        })

        const updated = await this.updateOne(
            { id: created2.id! },
            {
                lastName: 'Jay',
            }
        )

        assert.isEqual(updated.id, created1.id)

        const match = await this.spyStore.findOne({
            lastName: 'Jay',
        })

        assert.isEqual(match?.id, created1.id)
        assert.isEqual(match?.firstName, 'Tay')
        assert.isFalsy(match?.extraField)

        assert.isEqualDeep(this.spyStore.lastWillUpdateRecord, created1)
    }

    @test()
    protected async pluginCanBlockUpdateOne() {
        this.plugin.setShouldAllowUpdateOne(false)

        const { created } = await this.createOne()
        const updated = await this.updateOne(
            {
                id: created.id!,
            },
            {
                ...this.generateRandomSpyValues(),
            }
        )

        assert.isEqualDeep(updated, created)
    }

    @test()
    protected async throwsNotFoundIfQueryReturnedReturnsNoResults() {
        this.plugin.setQueryToReturnOnWillUpdateOne({
            firstName: generateId(),
        })

        await this.createOne()

        const err = await assert.doesThrowAsync(() =>
            this.updateOne(
                {},
                {
                    firstName: generateId(),
                }
            )
        )

        errorAssert.assertError(err, 'RECORD_NOT_FOUND')
    }

    @test()
    protected async deleteOneGetsExpectedParams() {
        const { created } = await this.createOne()

        const query = {
            id: created.id!,
        }

        assert.doesThrow(() => this.plugin.assertWillDeleteOneParameters(query))

        await this.deleteOne(query)
        this.plugin.assertWillDeleteOneParameters(query)
    }

    @test()
    protected async handlesMultiplePluginsOnDeleteOne() {
        const plugin = this.addNewPlugin()

        const { created } = await this.createOne()

        const query = {
            id: created.id!,
        }

        await this.deleteOne(query)

        plugin.assertWillDeleteOneParameters(query)
    }

    @test()
    protected async deleteOneCanUpdateQuery() {
        const { created: c1 } = await this.createOne()
        const { created: c2 } = await this.createOne()

        this.plugin.setQueryToReturnOnWillDeleteOne({
            id: c1.id,
        })

        await this.deleteOne({
            id: c2.id,
        })

        const count = await this.spyStore.count({ id: c1.id! })
        assert.isEqual(count, 0)
    }

    @test()
    protected async canMixinValuesOnFindOne() {
        const { created } = await this.createOne()

        const values = {
            what: generateId(),
        }

        this.plugin.setMixinOnFindOneValues(values)

        const found = await this.findOne({
            id: created.id!,
        })

        assert.doesInclude(found, values)
    }

    @test()
    protected async passesExpectedParamsToWillFindOne() {
        const { created } = await this.createOne()

        const query = {
            id: created.id!,
        }

        await this.findOne(query)

        this.plugin.assertWillFindOneParameters(query, created)
    }

    @test()
    protected async canMixinValuesFromMultiplePluginsOnFindOne() {
        const { created } = await this.createOne()

        const values1 = {
            what: generateId(),
        }

        this.plugin.setMixinOnFindOneValues(values1)

        const plugin = this.addNewPlugin()

        const values2 = {
            the: generateId(),
        }

        plugin.setMixinOnFindOneValues(values2)

        const found = await this.findOne({
            id: created.id!,
        })

        assert.doesInclude(found, {
            ...values1,
            ...values2,
        })
    }

    private async assertFirstSaveIncludes(values: Record<string, any>) {
        const match = await this.db.findOne(this.collectionName)
        assert.doesInclude(match, values)
    }

    private async findOne(query: { id: string }) {
        return await this.spyStore.findOne(query)
    }

    private async deleteOne(query: Record<string, any>) {
        await this.spyStore.deleteOne(query as any)
    }

    private async updateOne(
        query: Partial<SpyRecord>,
        updates: Partial<SpyRecord>
    ) {
        return await this.spyStore.updateOne(query as any, updates)
    }

    private setNewValuesWillCreateOne(expected: { hello: string }) {
        this.plugin.setNewValuesWillCreateOne(expected)
    }

    private async randomlyUpdateOne() {
        const { created } = await this.createOne()
        const updates = this.generateRandomSpyValues()

        const query = {
            id: created.id!,
        }

        await this.updateOne(query, updates)
        return { query, updates }
    }

    private setValuesToMixinBeforeCreate(values: Record<string, any>) {
        this.plugin.setValuesToMixinBeforeCreate(values)
    }

    private async createOne(v?: Partial<SpyRecord>) {
        const values = this.generateRandomSpyValues()
        const created = await this.spyStore.createOne({ ...values, ...v })
        return { created, values }
    }

    private generateRandomSpyValues() {
        return {
            firstName: generateId(),
            lastName: generateId(),
        }
    }
}
