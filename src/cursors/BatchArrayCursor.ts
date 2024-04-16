import { assertOptions } from '@sprucelabs/schema'
import { BatchCursor, OnNextResultsHandler } from './BatchCursor'

export default class BatchArrayCursor<T> implements BatchCursor<T> {
    private items: T[]
    private options?: BatchArrayCursorOptions | undefined
    private currenIndex = 0
    private onNextResultsHandler?: OnNextResultsHandler<T>

    public constructor(items: T[], options?: BatchArrayCursorOptions) {
        assertOptions({ items }, ['items'])
        this.items = items
        this.options = options
    }

    public async getTotalRecords(): Promise<number> {
        return this.items.length
    }

    public setOnNextResults(cb: OnNextResultsHandler<T>): void {
        this.onNextResultsHandler = cb
    }

    public async next(): Promise<T[] | null> {
        const { batchSize = 10 } = this.options ?? {}

        const i = this.items.slice(
            this.currenIndex,
            this.currenIndex + batchSize
        )
        this.currenIndex += batchSize

        if (this.onNextResultsHandler) {
            return this.onNextResultsHandler?.(i) as any
        }

        return i.length ? i : null
    }

    public [Symbol.asyncIterator](): AsyncIterator<T, T, undefined> {
        return {
            next: async () => {
                const value = await this.next()
                return { value, done: value === null } as any
            },
        }
    }
}

export interface BatchArrayCursorOptions {
    batchSize?: number
}
