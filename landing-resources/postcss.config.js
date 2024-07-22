const autoprefixer = require('autoprefixer')(['last 2 versions', 'ie >= 11']);

module.exports = {
	plugins: [...(process.env.HUGO_ENVIRONMENT === 'production' ? [autoprefixer] : [autoprefixer])],
};
