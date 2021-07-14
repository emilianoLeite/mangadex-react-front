module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    "cypress/globals": true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:jest/recommended",
    "plugin:jest/style",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: "module",
  },
  plugins: ["react", "@typescript-eslint", "cypress", "jest"],
  ignorePatterns: ["./mangadex-client/**/*.js", "./mangadex-client/**/*.ts"],
  rules: {
    indent: ["error", 2],
    "linebreak-style": ["error", "unix"],
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "react/jsx-uses-react": "off",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "jest/prefer-expect-assertions": [
      "warn",
      { onlyFunctionsWithAsyncKeyword: true },
    ],
  },
};
