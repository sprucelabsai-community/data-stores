import { test, suite, assert } from '@sprucelabs/test-utils'
import AbstractStoreTest from './support/AbstractStoreTest'
import { OperationsRecord } from './support/OperationsDummyStore'

@suite()
export default class UsingOperatorsTest extends AbstractStoreTest {
    private record!: OperationsRecord

    protected async beforeEach(): Promise<void> {
        await super.beforeEach()
        await this.createOne()
    }

    @test()
    protected async can$pushOnUpdate() {
        await this.push({ arrayOfStrings: 'test' })
        this.assertArrayOfStringsEquals(['test'])
        await this.push({ arrayOfStrings: 'another' })
        this.assertArrayOfStringsEquals(['test', 'another'])
        await this.push({ arrayOfNumbers: 1 })
        this.assertArrayOfNumbersEquals([1])
    }

    @test()
    protected async canIncrement() {
        await this.updateOne({ $inc: { score: 1 } })
        assert.isEqual(this.record.score, 1)
    }

    private assertArrayOfStringsEquals(expected: string[]) {
        assert.isEqualDeep(this.record.arrayOfStrings, expected)
    }

    private assertArrayOfNumbersEquals(expected: number[]) {
        assert.isEqualDeep(this.record.arrayOfNumbers, expected)
    }

    private async push(push: Record<string, any>) {
        await this.updateOne({
            $push: push,
        })
    }

    private async updateOne(updates: Record<string, any>) {
        this.record = await this.operationsStore.updateOne(
            {
                id: this.record.id,
            },
            updates
        )
    }

    private async createOne() {
        this.record = await this.operationsStore.createOne({
            arrayOfStrings: [],
            arrayOfNumbers: [],
            score: 0,
        })
    }
}
