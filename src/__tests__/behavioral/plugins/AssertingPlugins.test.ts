import { test, assert, errorAssert, generateId } from '@sprucelabs/test-utils'
import storePluginAssert from '../../../tests/storePluginAssert'
import AbstractPluginTest from './AbstractPluginTest'

export default class AssertingPluginsTest extends AbstractPluginTest {
	@test()
	protected static async throwsWithMissingRequired() {
		//@ts-ignore
		const err = assert.doesThrow(() => storePluginAssert.storeHasPlugin())
		errorAssert.assertError(err, 'MISSING_PARAMETERS', {
			parameters: ['store', 'pluginName'],
		})
	}

	@test()
	protected static async passesIfPluginFound() {
		const plugin = this.addNewPlugin()
		this.assertHasPlugin(plugin.getName())
	}

	@test()
	protected static async throwsIfNoPlugins() {
		const plugin = this.MockPlugin()
		this.assertHasPluginThrows(plugin.getName())
	}

	@test()
	protected static async throwsIfPluginNotFound() {
		this.addNewPlugin()
		assert.doesThrow(() => this.assertHasPlugin(generateId()))
	}

	@test()
	protected static async canFindSecondPlugin() {
		this.addNewPlugin()
		const plugin = this.addNewPlugin()
		plugin.randomizeName()
		this.assertHasPlugin(plugin.getName())
	}

	@test()
	protected static async returnsPlugin() {
		const plugin = this.addNewPlugin()
		const found = this.assertHasPlugin(plugin.getName())
		assert.isEqual(found, plugin)
	}

	private static assertHasPluginThrows(name: string) {
		assert.doesThrow(() => this.assertHasPlugin(name))
	}

	private static assertHasPlugin(name: string): any {
		return storePluginAssert.storeHasPlugin(this.spyStore, name)
	}
}
