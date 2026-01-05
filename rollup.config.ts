import { defineConfig } from "rollup";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import terser from "@rollup/plugin-terser";
import { cleandir } from "rollup-plugin-cleandir";
import typescript from "@rollup/plugin-typescript";

export default defineConfig({
  input: "./packages/index.ts",

  plugins: [
    cleandir("lib"),

    resolve({
      extensions: [".js", ".ts"],
    }),
    commonjs(),
    typescript(),
  ],

  // ✅ 输出期配置
  output: [
    {
      file: "lib/es/xt-post.js",
      format: "es",
      sourcemap: true,
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false },
        }),
      ],
    },
    {
      file: "lib/xt-post.umd.js",
      format: "umd",
      name: "XtPost",
      sourcemap: true,
    },
    {
      file: "lib/xt-post.umd.min.js",
      format: "umd",
      name: "XtPost",
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false },
        }),
      ],
    },
    {
      file: "lib/cjs/xt-post.min.js",
      format: "cjs",
      sourcemap: true,
      plugins: [
        terser({
          compress: { drop_console: false },
          format: { comments: false },
        }),
      ],
    },
  ],
});
