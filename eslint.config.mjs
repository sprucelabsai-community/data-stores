import { buildEsLintConfig } from 'eslint-config-spruce'

export default buildEsLintConfig({
    'ignores': ['build/**', 'esm/**', 'node_modules/**', '!build/**/mongo.types.js', '**/.spruce/**']
})
