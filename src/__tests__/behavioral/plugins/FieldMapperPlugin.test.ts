import { buildSchema } from '@sprucelabs/schema'
import { test, assert } from '@sprucelabs/test-utils'
import {
	DataStorePlugin,
	DataStorePluginPrepareResponse,
	DataStorePluginWillCreateOneResponse,
} from '../../../types/stores.types'
import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'

export default class FieldMapperPluginTest extends AbstractStoreTest {
	private static plugin: DatabaseFieldMapperPlugin
	protected static async beforeEach() {
		await super.beforeEach()
		this.plugin = new DatabaseFieldMapperPlugin()
		this.spyStore.addPlugin(this.plugin)
	}

	@test()
	protected static async pluginHasExpectedName() {
		assert.isEqual(this.plugin.getName(), 'fieldMapper')
	}

	@test()
	protected static async canMapFieldsOnCreate() {
		this.spyStore.setFullSchema(personSchemaFull)
		this.spyStore.setDatabaseSchema(personSchemaDatabase)
		this.spyStore.setPrimaryFieldNames(['personid'])

		const created = await this.spyStore.createOne({
			firstName: 'Bob',
			lastName: 'Smith',
		})

		const actual = await this.db.findOne(this.spyStore.getCollectionName(), {})

		//@ts-ignore NeDB adds this id field no matter what (store removes it)
		delete actual.id

		assert.isEqualDeep(actual, {
			first: 'Bob',
			last: 'Smith',
			personid: created.id,
		})
	}
}

const personSchemaFull = buildSchema({
	id: 'fullPerson',
	fields: {
		id: {
			type: 'id',
			isRequired: true,
		},
		firstName: {
			type: 'text',
			isRequired: true,
		},
		lastName: {
			type: 'text',
			isRequire: true,
		},
	},
})

const personSchemaDatabase = buildSchema({
	id: 'databasePerson',
	fields: {
		personid: {
			type: 'id',
			isRequired: true,
		},
		first: {
			type: 'text',
			isRequired: true,
		},
		last: {
			type: 'text',
			isRequire: true,
		},
	},
})

class DatabaseFieldMapperPlugin implements DataStorePlugin {
	public constructor() {}
	public getName(): string {
		return 'fieldMapper'
	}

	public async willCreateOne(
		values: Record<string, any>
	): Promise<void | DataStorePluginWillCreateOneResponse> {
		return {
			newValues: {
				first: values.firstName,
				last: values.lastName,
			},
		}
	}

	public async prepareRecord(
		record: Record<string, any>
	): Promise<void | DataStorePluginPrepareResponse> {
		return {
			newValues: {
				id: record.personid,
				firstName: record.first,
				lastName: record.last,
			},
		}
	}
}
