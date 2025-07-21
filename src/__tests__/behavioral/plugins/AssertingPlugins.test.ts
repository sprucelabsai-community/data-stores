import {
    test,
    suite,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import storePluginAssert from '../../../tests/storePluginAssert'
import AbstractPluginTest from './AbstractPluginTest'

@suite()
export default class AssertingPluginsTest extends AbstractPluginTest {
    @test()
    protected async throwsWithMissingRequired() {
        //@ts-ignore
        const err = assert.doesThrow(() => storePluginAssert.storeHasPlugin())
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['store', 'pluginName'],
        })
    }

    @test()
    protected async passesIfPluginFound() {
        const plugin = this.addNewPlugin()
        this.assertHasPlugin(plugin.getName())
    }

    @test()
    protected async throwsIfNoPlugins() {
        const plugin = this.MockPlugin()
        this.assertHasPluginThrows(plugin.getName())
    }

    @test()
    protected async throwsIfPluginNotFound() {
        this.addNewPlugin()
        assert.doesThrow(() => this.assertHasPlugin(generateId()))
    }

    @test()
    protected async canFindSecondPlugin() {
        this.addNewPlugin()
        const plugin = this.addNewPlugin()
        plugin.randomizeName()
        this.assertHasPlugin(plugin.getName())
    }

    @test()
    protected async returnsPlugin() {
        const plugin = this.addNewPlugin()
        const found = this.assertHasPlugin(plugin.getName())
        assert.isEqual(found, plugin)
    }

    private assertHasPluginThrows(name: string) {
        assert.doesThrow(() => this.assertHasPlugin(name))
    }

    private assertHasPlugin(name: string): any {
        return storePluginAssert.storeHasPlugin(this.spyStore, name)
    }
}
