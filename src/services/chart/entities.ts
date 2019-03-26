export const entities = Object.values(require('require-all')({
	dirname: __dirname + '/charts',
	resolve: (x: any) => {
		return new x.default().entity;
	}
}));
