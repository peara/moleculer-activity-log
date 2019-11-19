module.exports = {
    "root": true,
    "env": {
        "node": true,
        "commonjs": true,
        "es6": true,
        "jquery": false,
        "jest": true,
        "jasmine": true
    },
    "extends": "airbnb-base/legacy",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 2018
    },
    "rules": {
        "indent": ["error", 4],
        "no-tabs": "error",
        "no-unused-vars": "warn",
        "no-console": "error",
        "arrow-spacing": ["error", { "before": true, "after": true  }],
        "max-len": ["error", {
            "code": 120,
            "ignoreComments": true,
            "ignoreTrailingComments": true,
            "ignoreUrls": true,
            "ignoreStrings": true,
            "ignoreTemplateLiterals": true,
            "ignoreRegExpLiterals": true
        }]
    }
}
