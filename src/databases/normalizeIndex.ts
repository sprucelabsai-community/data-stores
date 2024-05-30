import { IndexWithFilter } from '../types/database.types'

export default function normalizeIndex(index: string[] | IndexWithFilter) {
    const fields = Array.isArray(index) ? index : index.fields
    const filter = Array.isArray(index) ? undefined : index.filter
    return { fields, filter }
}
