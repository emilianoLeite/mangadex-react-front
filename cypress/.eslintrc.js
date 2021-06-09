module.exports = {
  extends: ["../.eslintrc.js"],
  overrides: [
    {
      files: ["**/*"],
      rules: {
        "jest/expect-expect": "off",
      },
    },
  ],
};
