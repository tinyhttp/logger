import ts from '@rollup/plugin-typescript'
import pkg from './package.json' assert { type: 'json' }

export default {
  input: 'src/index.ts',
  output: [
    {
      dir: 'dist',
      format: 'esm'
    }
  ],
  plugins: [ts()],
  external: [...Object.keys(pkg.dependencies), 'http']
}
