import StoreFactory from '../../../../factories/StoreFactory'
import AbstractDatabaseTest from '../../../../tests/AbstractDatabaseTest'
import DummyStore from './DummyStore'
import OperationsStore from './OperationsDummyStore'
import SpyStore from './SpyStore'

export default abstract class AbstractStoreTest extends AbstractDatabaseTest {
    protected static spyStore: SpyStore
    protected static dummyStore: DummyStore
    protected static stores: StoreFactory
    protected static operationsStore: OperationsStore

    protected static async beforeEach() {
        await super.beforeEach()
        await this.connectToDatabase()

        this.stores = StoreFactory.Factory(this.db)

        this.stores.setStoreClass('spy', SpyStore)
        this.stores.setStoreClass('dummy', DummyStore)
        this.stores.setStoreClass('operations', OperationsStore)

        this.spyStore = await this.stores.getStore('spy')
        this.dummyStore = await this.stores.getStore('dummy')
        this.operationsStore = await this.stores.getStore('operations')
    }
}
