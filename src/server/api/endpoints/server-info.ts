import * as os from 'os';
import * as si from 'systeminformation';
import define from '../define';

export const meta = {
	requireCredential: false as const,

	desc: {
	},

	tags: ['meta'],

	params: {
	},
};

export default define(meta, async () => {
	// const memStats = await si.mem();
	// const fsStats = await si.fsSize();

	// return {
	// 	machine: os.hostname(),
	// 	cpu: {
	// 		model: os.cpus()[0].model,
	// 		cores: os.cpus().length
	// 	},
	// 	mem: {
	// 		total: memStats.total
	// 	},
	// 	fs: {
	// 		total: fsStats[0].size,
	// 		used: fsStats[0].used,
	// 	},
	// };

	return {
		machine: "喵窝",
		cpu: {
			model: "nya.one",
			cores: 2147483647,
		},
		mem: {
			total: 0
		},
		fs: {
			total: 0,
			used: 0,
		},
	}
});
