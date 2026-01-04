import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import terser from '@rollup/plugin-terser'
import { cleandir } from 'rollup-plugin-cleandir'

export default defineConfig({
  input: './packages/index.ts',

  plugins: [
    cleandir('lib'),
    resolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false,
      declarationMap: false
    })
  ],

  // ✅ 输出期配置
  output: [
    {
      file: './lib/es/xt-post.js',
      format: 'es',
      sourcemap: true,
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false }
        })
      ]
    },
    {
      file: './lib/xt-post.min.js',
      format: 'iife',
      sourcemap: true,
      name: 'XtPost',
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false }
        })
      ]
    },
    {
      file: './lib/cjs/xt-post.min.js',
      format: 'cjs',
      sourcemap: true,
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false }
        })
      ]
    }
  ]
})
