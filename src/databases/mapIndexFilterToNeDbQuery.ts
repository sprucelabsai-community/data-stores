import { cloneDeep } from '@sprucelabs/schema'

export default function mapIndexFilterToNeDbQuery(filter: Record<string, any>) {
    const final = cloneDeep(filter)
    for (const key of Object.keys(final)) {
        if (final[key].$type === 'string') {
            final[key] = { $ne: null }
        }
    }
    return final
}
