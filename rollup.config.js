import resolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel'

export default {
  input: 'src/main.js',
  output: {
    file: 'dist/vk-chat-bot.js',
    format: 'cjs',
    sourcemap: 'inline'
  },
  plugins: [
    resolve(),
    babel({
      exclude: 'node_modules/**',
      babelrc: false,
      presets: [
        ['@babel/preset-env', {
          modules: false
        }]
      ]
    })
  ]
}
