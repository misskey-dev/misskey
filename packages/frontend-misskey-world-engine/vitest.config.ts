export default {
	test: {
		include: ['./test/**/*.test.ts'],
		environment: 'node',
		globals: true,
		execArgv: ['--no-warnings'],
	},
};
