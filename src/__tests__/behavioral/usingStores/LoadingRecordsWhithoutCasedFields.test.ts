import { test, assert, generateId } from '@sprucelabs/test-utils'
import databaseAssertUtil from '../../../tests/databaseAssertUtil'
import AbstractStoreTest from './support/AbstractStoreTest'
import SimpleStore from './support/SimpleStore'

export default class LoadingRecordsWhithoutCasedFieldsTest extends AbstractStoreTest {
    private static simple: SimpleStore
    private static lowerCase: {
        id: string
        sensorname: string
        vendorid: string
        sensorcode: string
        isvalid?: boolean
    }
    private static expected: {
        id: string
        sensorName: string
        vendorId: string
        sensorCode: string
        isValid?: boolean
    }

    protected static async beforeEach(): Promise<void> {
        await super.beforeEach()
        this.stores.setStoreClass('simple', SimpleStore)
        this.simple = await this.stores.getStore('simple')

        this.lowerCase = {
            id: generateId(),
            sensorname: generateId(),
            vendorid: generateId(),
            sensorcode: generateId(),
        }

        this.expected = {
            id: this.lowerCase.id,
            sensorName: this.lowerCase.sensorname,
            vendorId: this.lowerCase.vendorid,
            sensorCode: this.lowerCase.sensorcode,
        }

        const db = this.dummyStore.getDb()

        db.find = async () => {
            return [this.lowerCase]
        }
    }

    @test()
    protected static async canMapLowerToCamel() {
        await this.assertFindMatchesExpected()
    }

    @test()
    protected static async canMapFalsyBooleanFieldToCamel() {
        this.lowerCase.isvalid = false
        this.expected.isValid = false
        await this.assertFindMatchesExpected()
    }

    @test()
    protected static async mappingHonorsShouldMapSetting() {
        this.simple.setShouldMap(false)
        const actual = await this.findOne()
        //@ts-ignore
        assert.isEqualDeep(actual, {
            id: this.lowerCase.id,
        })
    }

    @test()
    protected static async canAssertMappingIsEnabled() {
        assert.doesThrow(() =>
            databaseAssertUtil.assertHasLowerCaseToCamelCaseMappingEnabled(
                this.dummyStore
            )
        )

        databaseAssertUtil.assertHasLowerCaseToCamelCaseMappingEnabled(
            this.simple
        )
    }

    private static async assertFindMatchesExpected() {
        const actual = await this.findOne()
        assert.isEqualDeep(actual, this.expected)
    }

    private static async findOne() {
        return await this.simple.findOne({})
    }
}
