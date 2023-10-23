import StoreFactory from '../../../../factories/StoreFactory'
import AbstractDatabaseTest from '../../../../tests/AbstractDatabaseTest'
import CustomPrimaryStore from './CustomPrimaryStore'
import CustomPrimaryStore2 from './CustomPrimaryStore2'
import DummyStore from './DummyStore'
import OperationsStore from './OperationsDummyStore'
import SpyStore from './SpyStore'

export default abstract class AbstractStoreTest extends AbstractDatabaseTest {
	protected static spyStore: SpyStore
	protected static dummyStore: DummyStore
	protected static stores: StoreFactory
	protected static operationsStore: OperationsStore
	protected static customPrimaryStore: CustomPrimaryStore
	protected static customPrimaryStore2: CustomPrimaryStore2

	protected static async beforeEach() {
		await super.beforeEach()
		await this.connectToDatabase()

		this.stores = StoreFactory.Factory(this.db)

		this.stores.setStoreClass('spy', SpyStore)
		this.stores.setStoreClass('dummy', DummyStore)
		this.stores.setStoreClass('operations', OperationsStore)
		this.stores.setStoreClass('customPrimary', CustomPrimaryStore)
		this.stores.setStoreClass('customPrimary2', CustomPrimaryStore2)

		this.spyStore = await this.stores.getStore('spy')
		this.dummyStore = await this.stores.getStore('dummy')
		this.operationsStore = await this.stores.getStore('operations')
		this.customPrimaryStore = await this.stores.getStore('customPrimary')
		this.customPrimaryStore2 = await this.stores.getStore('customPrimary2')
	}
}
