import { FindOneOptions, ObjectID } from 'mongodb'
import SpruceError from '../errors/SpruceError'
import { QueryOptions } from '../types/query.types'

const mongoUtil = {
	mapQuery(
		query: Record<string, any>,
		options: { shouldTransformToObjectId?: boolean } = {}
	) {
		const q = query || {}
		const opts = options
		if (Object.prototype.hasOwnProperty.call(q, 'id') && q.id === undefined) {
			throw new SpruceError({
				code: 'MONGO_ID_MAPPING_ERROR',
				friendlyMessage: '`id` cannot be undefined',
			})
		}

		const { id, ...rest } = q
		let normalizedValues = rest

		if (typeof id === 'string') {
			normalizedValues._id =
				opts.shouldTransformToObjectId === false ? id : new ObjectID(id)
		} else if (id) {
			normalizedValues._id = mapNestedIdValues(id, options)
		}

		return normalizedValues
	},

	prepareUpdates(updates: Record<string, any>) {
		let hasDollarSigns = !!Object.keys(updates).find((key) => key[0] === '$')
		const values = hasDollarSigns ? updates : { $set: updates }
		return values
	},

	queryOptionsToMongoFindOptions(options?: QueryOptions): FindOneOptions<any> {
		const { sort, ...rest } = options || {}
		const mappedOptions: FindOneOptions<any> = { ...rest }

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
		if (['$gt', '$lt', '$gte', '$lte'].indexOf(key) > -1) {
			mapped[key] =
				options.shouldTransformToObjectId === false
					? id[key]
					: new ObjectID(id[key])
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
							: new ObjectID(value)
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
