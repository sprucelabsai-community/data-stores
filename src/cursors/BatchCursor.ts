import { Schema, SchemaFieldNames, assertOptions } from '@sprucelabs/schema'
import AbstractStore from '../stores/AbstractStore'
import { QueryOptions } from '../types/query.types'
import { PrepareOptions } from '../types/stores.types'

export default class BatchCursorImpl<
    ResponseRecord,
> implements BatchCursor<ResponseRecord> {
    public static Class?: new (...args: any[]) => BatchCursor<any>
    private store: AbstractStore<Schema>
    private options?: FindBatchOptions
    protected query?: Record<string, any>
    private nextHandler?: OnNextResultsHandler<ResponseRecord>
    private lastId?: string

    protected constructor(
        store: AbstractStore<Schema>,
        query?: Record<string, any>,
        options?: FindBatchOptions
    ) {
        this.store = store
        this.query = query
        this.options = options
    }

    public [Symbol.asyncIterator](): AsyncIterator<
        ResponseRecord,
        any,
        undefined
    > {
        return {
            next: async () => {
                const value = await this.next()
                return { value, done: value === null } as any
            },
        }
    }

    public static Cursor<Response>(
        store: AbstractStore<Schema>,
        query?: Record<string, any>,
        options?: FindBatchOptions
    ) {
        assertOptions(
            { store },
            ['store'],
            'You need to pass a store to BatchCursor.Cursor()'
        )
        return new (this.Class ?? this)(
            store,
            query,
            options
        ) as BatchCursor<Response>
    }

    public setOnNextResults(cb: OnNextResultsHandler<ResponseRecord>): void {
        this.nextHandler = cb
    }

    public async getTotalRecords(): Promise<number> {
        return this.store.count({ ...(this.query as any) })
    }

    public async next(): Promise<ResponseRecord[] | null> {
        const { batchSize = 10, ...rest } = this.options ?? {}

        let query = { ...(this.query as any) }

        if (this.lastId) {
            query = {
                $and: [this.query ?? {}, { id: { $gt: this.lastId } }],
            }
        }

        const matches = await this.store.find(
            query,
            {
                limit: batchSize,
            },
            {
                ...(rest as any),
            }
        )

        if (matches.length === 0) {
            return null
        }

        this.bumpCursorPosition(matches)

        if (this.nextHandler) {
            return this.nextHandler(matches as ResponseRecord[]) as any
        }

        return matches as ResponseRecord[]
    }

    private bumpCursorPosition(matches: Record<string, any>[]) {
        const last = matches[matches.length - 1]
        if (last) {
            if (!this.query) {
                this.query = {}
            }
            this.lastId = last.id
        }
    }
}

export interface FindBatchOptions<
    IncludePrivateFields extends boolean = true,
    FullSchema extends Schema = Schema,
    F extends SchemaFieldNames<FullSchema> = SchemaFieldNames<FullSchema>,
>
    extends
        Omit<QueryOptions, 'includeFields'>,
        PrepareOptions<IncludePrivateFields, FullSchema, F> {
    batchSize?: number
}

export type OnNextResultsHandler<ResponseRecord> = (
    results: ResponseRecord[]
) => Record<string, any>[] | Promise<Record<string, any>[]>

export interface BatchCursor<
    ResponseRecord,
> extends AsyncIterable<ResponseRecord> {
    getTotalRecords(): Promise<number>
    setOnNextResults(cb: OnNextResultsHandler<ResponseRecord>): void
    next(): Promise<ResponseRecord[] | null>
}
