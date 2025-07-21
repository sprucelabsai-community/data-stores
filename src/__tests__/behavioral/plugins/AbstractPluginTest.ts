import AbstractStoreTest from '../usingStores/support/AbstractStoreTest'
import MockPlugin from './MockPlugin'

export default abstract class AbstractPluginTest extends AbstractStoreTest {
    protected addNewPlugin() {
        const plugin = this.MockPlugin()
        this.spyStore.addPlugin(plugin)
        return plugin
    }

    protected MockPlugin() {
        return new MockPlugin()
    }
}
