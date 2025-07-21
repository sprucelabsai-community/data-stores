import { assert } from '@sprucelabs/test-utils'
import {
    DataStorePlugin,
    DataStorePluginDidCreateOneResponse,
    DataStorePluginDidFindOneResponse,
    DataStorePluginWillDeleteOneResponse,
    DataStorePluginWillUpdateOneResponse,
} from '../../../types/stores.types'
import generateId from '../../../utilities/generateId'

export default class MockPlugin implements DataStorePlugin {
    private didCreateOneRecord?: Record<string, any>
    private willCreateOneValues?: Record<string, any>
    private willUpdateOneParams?: {
        query: Record<string, any>
        updates: Record<string, any>
    }
    private didFindOneParams?: {
        query: Record<string, any>
        record: Record<string, any>
    }
    private valuesToMixinAfterCreate?: Record<string, any>
    private queryToReturnOnWillUpdateOne?: Record<string, any>
    private willDeleteOneQuery?: Record<string, any>
    private queryToReturnOnWillDeleteOne?: Record<string, any>

    private name = 'mock'
    private valuesToMixinBeforeCreate?: Record<string, any>
    private newValuesWillCreateOne?: Record<string, any>
    private shouldAllowUpdateOne = true

    public async didCreateOne(
        record: Record<string, any>
    ): Promise<void | DataStorePluginDidCreateOneResponse> {
        this.didCreateOneRecord = record
        return {
            valuesToMixinBeforeReturning: this.valuesToMixinAfterCreate,
        }
    }

    public async willCreateOne(values: Record<string, any>) {
        this.willCreateOneValues = values
        return {
            valuesToMixinBeforeCreate: this.valuesToMixinBeforeCreate,
            newValues: this.newValuesWillCreateOne,
        }
    }

    public setNewValuesWillCreateOne(values: Record<string, any>) {
        this.newValuesWillCreateOne = values
    }

    public setValuesToMixinBeforeCreate(values: Record<string, any>) {
        this.valuesToMixinBeforeCreate = values
    }

    public async willDeleteOne(
        query: Record<string, any>
    ): Promise<void | DataStorePluginWillDeleteOneResponse> {
        this.willDeleteOneQuery = query
        return {
            query: this.queryToReturnOnWillDeleteOne,
        }
    }

    public async didFindOne(
        query: Record<string, any>,
        record: Record<string, any>
    ): Promise<void | DataStorePluginDidFindOneResponse> {
        this.didFindOneParams = {
            query,
            record,
        }

        return {
            valuesToMixinBeforeReturning: this.valuesToMixinAfterCreate,
        }
    }

    public setQueryToReturnOnWillDeleteOne(query: Record<string, any>) {
        this.queryToReturnOnWillDeleteOne = query
    }

    public setShouldAllowUpdateOne(shouldAllow: boolean) {
        this.shouldAllowUpdateOne = shouldAllow
    }

    public async willUpdate(
        query: Record<string, any>,
        updates: Record<string, any>
    ): Promise<void | DataStorePluginWillUpdateOneResponse> {
        this.willUpdateOneParams = {
            query,
            updates,
        }

        return {
            query: this.queryToReturnOnWillUpdateOne,
            shouldUpdate: !!this.shouldAllowUpdateOne,
        }
    }

    public assertWillUpdateOneParameters(
        query: Record<string, any>,
        updates: Record<string, any>
    ) {
        assert.isEqualDeep(this.willUpdateOneParams?.query, query)
        assert.isEqualDeep(this.willUpdateOneParams?.updates, updates)
    }

    public assertDidCreateOneParameters(record: Record<string, any>) {
        assert.isEqualDeep(this.didCreateOneRecord, {
            ...record,
        })
    }

    public assertWillCreateOneParameters(values: Record<string, any>) {
        assert.isEqualDeep(this.willCreateOneValues, {
            ...values,
        })
    }

    public assertWillDeleteOneParameters(query: Record<string, any>) {
        assert.isEqualDeep(this.willDeleteOneQuery, query)
    }

    public assertWillFindOneParameters(
        query: Record<string, any>,
        record: Record<string, any>
    ) {
        assert.isEqualDeep(this.didFindOneParams, {
            query,
            record,
        })
    }

    public getName(): string {
        return this.name
    }

    public randomizeName() {
        this.name = generateId()
    }

    public setValuesToMixinAfterCreate(mixinValues: Record<string, any>) {
        this.valuesToMixinAfterCreate = mixinValues
    }

    public setQueryToReturnOnWillUpdateOne(query: Record<string, any>) {
        this.queryToReturnOnWillUpdateOne = query
    }

    public setMixinOnFindOneValues(values: Record<string, any>) {
        this.valuesToMixinAfterCreate = values
    }
}
