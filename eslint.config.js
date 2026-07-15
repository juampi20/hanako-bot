const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
        rules: {
            "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
            "eqeqeq": "error",
            "curly": "error",
            "no-var": "error",
            "prefer-const": "error",
        },
    },
    {
        files: ["src/__tests__/**"],
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
    },
    {
        ignores: ["node_modules/", ".git/"],
    },
];
