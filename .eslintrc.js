module.exports = {
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    root: true,
    rules: {
        quotes: ["error", "double"],
        semi: ["error", "always"]
    },
    env: {
        browser: true,
        node: true
    }
};