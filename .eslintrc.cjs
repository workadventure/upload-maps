module.exports = {
    env: {
        browser: true,
        es2021: true,
    },
    extends: ["eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    'plugin:@typescript-eslint/recommended',
    "plugin:@typescript-eslint/recommended-requiring-type-checking"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: 'tsconfig.json',
        ecmaVersion: "latest",
        sourceType: "module",
    },
    plugins: ["@typescript-eslint"],
};
