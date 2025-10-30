/** @type {import('lint-staged').Config} */
module.exports = {
  ignore: ['**/node_modules/**'],
  '**/*.{ts,tsx,js,jsx}': ['prettier --write', 'eslint --fix'],
  '**/*.{json,md,css,scss,html}': ['prettier --write'],
};
