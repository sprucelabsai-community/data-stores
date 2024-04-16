import { Schema, assertOptions } from '@sprucelabs/schema'
import { assert } from '@sprucelabs/test-utils'
import AbstractStore from '../stores/AbstractStore'

const storePluginAssert = {
    storeHasPlugin: (store: AbstractStore<Schema>, pluginName: string) => {
        assertOptions(
            {
                store,
                pluginName,
            },
            ['store', 'pluginName']
        )

        //@ts-ignore
        const { plugins } = store

        if (!plugins?.length) {
            assert.fail(
                `The store you passed has no plugins. Add one to 'protected plugins: DataStorePlugin[] = [...]' or add it in the constructor of your store with 'this.plugins[...]'`
            )
        }

        const plugin = plugins?.find((p) => p.getName() === pluginName)

        if (plugin?.getName() !== pluginName) {
            assert.fail(
                `I could not find the plugin '${pluginName}' in the store you passed. Make sure you added it to 'protected plugins: DataStorePlugin[] = [...]' or added it in the constructor of your store with 'this.plugins[...]'`
            )
        }

        return plugin!
    },
}

export default storePluginAssert
