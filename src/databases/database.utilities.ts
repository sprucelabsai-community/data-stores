import differenceWith from 'lodash/differenceWith'
import { IndexWithFilter, Index } from '../types/database.types'

export function doesIndexesInclude(haystack: Index[], needle: Index) {
    for (const index of haystack ?? []) {
        if (areIndexesEqual(index, needle)) {
            return true
        }
    }

    return false
}

export function areIndexesEqual(left: Index, right: Index) {
    const name1 = generateIndexName(normalizeIndex(left))
    const name2 = generateIndexName(normalizeIndex(right))
    return name1 === name2
}

export function generateIndexName(indexWithFilter: IndexWithFilter) {
    if (indexWithFilter.name) {
        return indexWithFilter.name
    }
    let name = indexWithFilter.fields.join('_')
    if (indexWithFilter.filter) {
        name += '_filtered'
    }
    return name
}

export function normalizeIndex(index: Index): IndexWithFilter {
    const fields = Array.isArray(index) ? index : index.fields
    const filter = Array.isArray(index) ? undefined : index.filter
    fields.sort()
    return {
        fields,
        filter,
        name: (index as IndexWithFilter).name ?? undefined,
    }
}

export function pluckMissingIndexes(left: Index[], right: Index[]) {
    return differenceWith(left, right, areIndexesEqual)
}
