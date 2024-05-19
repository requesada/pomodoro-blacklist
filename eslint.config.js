import unicorn from 'eslint-plugin-unicorn'

export default [
    unicorn.configs['flat/recommended'],
    {
      rules: {
        'unicorn/prefer-top-level-await': 'off',
        'unicorn/consistent-function-scoping': 'off'
      }
    }
]