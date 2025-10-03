import { ObjectId } from 'mongodb'
import { FindOneOptions } from '../databases/mongo.types'
import SpruceError from '../errors/SpruceError'
import { QueryOptions } from '../types/query.types'

const mongoUtil = {
    mapQuery(
        query: Record<string, any>,
        options: { shouldTransformToObjectId?: boolean } = {}
    ) {
        const q = query || {}
        const opts = options
        const shouldTransformIdToObjectId =
            opts.shouldTransformToObjectId !== false
        if (
            Object.prototype.hasOwnProperty.call(q, 'id') &&
            q.id === undefined &&
            shouldTransformIdToObjectId
        ) {
            throw new SpruceError({
                code: 'MONGO_ID_MAPPING_ERROR',
                friendlyMessage: '`id` cannot be undefined',
            })
        }

        const { id, $or, $and, ...rest } = q
        let normalizedValues = rest

        if (Array.isArray($and)) {
            normalizedValues.$and = $and.map((a) => this.mapQuery(a, options))
        }

        if (Array.isArray($or)) {
            normalizedValues.$or = $or.map((o) => this.mapQuery(o, options))
        } else if (typeof id === 'string') {
            try {
                normalizedValues._id = !shouldTransformIdToObjectId
                    ? id
                    : new ObjectId(id)
            } catch (err) {
                normalizedValues._id = id
            }
        } else if (id) {
            normalizedValues._id = mapNestedIdValues(id, options)
        }

        return normalizedValues
    },

    prepareUpdates(updates: Record<string, any>) {
        let hasDollarSigns = !!Object.keys(updates).find(
            (key) => key[0] === '$'
        )
        const values = hasDollarSigns ? updates : { $set: updates }
        return values
    },

    queryOptionsToMongoFindOptions(
        options?: QueryOptions
    ): FindOneOptions<any> {
        const { sort, includeFields: fields = [], ...rest } = options || {}
        const mappedOptions: FindOneOptions<any> = { ...rest }

        if (fields.length > 0) {
            mappedOptions.projection = {
                _id: 0,
            }
            for (const field of fields) {
                mappedOptions.projection[field === 'id' ? '_id' : field] = 1
            }
        }

        if (sort) {
            let mongoSort: Record<string, number> = {}

            sort.forEach(
                (sort) =>
                    (mongoSort[sort.field === 'id' ? '_id' : sort.field] =
                        sort.direction === 'asc' ? 1 : -1)
            )
            mappedOptions.sort = mongoSort
        }

        return mappedOptions
    },
}

function mapNestedIdValues(
    id: any,
    options: { shouldTransformToObjectId?: boolean } = {}
) {
    const mapped: Record<string, any> = {}
    Object.keys(id).forEach((key) => {
        if (['$gt', '$lt', '$gte', '$lte', '$ne'].indexOf(key) > -1) {
            mapped[key] =
                options.shouldTransformToObjectId === false
                    ? id[key]
                    : new ObjectId(id[key])
        } else {
            if (!id[key] || !id[key].map) {
                throw new SpruceError({
                    code: 'MONGO_ID_MAPPING_ERROR',
                    friendlyMessage: `Invalid query, id: { ${key} } must be an array.`,
                })
            }
            mapped[key] = id[key].map((value: string) => {
                if (typeof value === 'string') {
                    try {
                        return options.shouldTransformToObjectId === false
                            ? value
                            : new ObjectId(value)
                    } catch (err) {
                        throw new SpruceError({
                            code: 'MONGO_ID_MAPPING_ERROR',
                            friendlyMessage: `Could not map '${value}' to an id.`,
                        })
                    }
                } else {
                    return mapNestedIdValues(value)
                }
            })
        }
    })

    return mapped
}

export default mongoUtil
