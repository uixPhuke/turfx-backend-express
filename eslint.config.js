module.exports = [
  { ignores: ["node_modules/**", "coverage/**", "public/**", "generated/**"] },
  {
    files: ["**/*.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
  },
];
