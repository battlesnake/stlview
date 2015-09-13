var config = {
	paths: { out: 'out' },
	bundles: {
		client: 'client.js',
		clientMap: 'client.json',
		vendor: 'vendor.js',
		styles: 'style.css'
	},
	globs: {
		js: ['./index.js'],
		less: ['./index.less'],
		jade: ['./index.jade'],
		npmAssets: ['node_modules/**/*.@(png|jpg|jpeg|gif|svg|ttf|otf|woff|woff2|eot)', 'shader/**', 'stl/**']
	},
	fonts: 'fonts.list',
	dependencies: require('./package.json').dependencies,
	jsFreeDependencies: ['font-awesome'],
	test: { port: 3000 }
};

require('battlemake')(config);
