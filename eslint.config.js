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
        ignores: ["node_modules/", ".git/"],
    },
];
