import * as os from '@/os';
import { $i } from '@/account';

export const ACHIEVEMENT_TYPES = [
	'bfb4bbb19d5042138db3ae32f23c4aa2',
	'86d5a0fdb382426ab0f01a1a2a9c287f',
	'7263a10c843d4c26986987850d9ce326',
	'af59e72ebddf484a97f5333778a56e48',
	'0dcc42f5aeb44e5eb79c4f1dd7100216',
	'329670f100504846988729b1f392395e',
	'47c1ccc95ba245df8bb1bf245bd9f517',
	'814b0d6655ad4379a28f46b67c188559',
	'ef26b5bd8e8b49438779f4a2c80de4ee',
	'd046b1342f9d46c192f899be14cf614a',
	'98c11358616746b7afbee3190851dfa4',
	'8d770b0cdda648caa1b1ae920ecd19e6',
	'dc7733a48033407082d20accffc74763',
	'1b2308ad4bec49deb62d24b62452c58c',
	'c7f0e1f9df2c4798a3785501caef3d14',
	'560f644ae17b40c282f0ee90c9939f56',
	'f2c2ef3eed2a46e2928a3b90ea763c2d',
	'b158c3154a9244779d644af4a7b3907d',
	'e1fb8e59f4fc4a0f9d7e5747a103ff16',
	'3dc5e086638e414e9bd9f605a46cbb5a',
	'db2496a32a9c47a2ace6271fb10c9890',
	'4d5abaebc2924792a97d548d4c7c09fe',
	'ba6688fa24a3475185a460d11dad47b2',
	'30d049b4deeb4d1382a6702307fd9b8a',
	'098fc6d1af604e9588cf2d637870355b',
	'455365961ef14786af76b15917b3accd',
	'e9abbdb33ce04a42b62798d4d001c614',
	'52dff3050a4a430db49b8f943d03d8d4',
	'173c61f28a934efbbc5342294b9a13a0',
	'a7cb1d292c494008822d69fc02f95e4c',
	'e3d7be8f803a47b698c38cc727e0462b',
] as const;

export const ACHIEVEMENT_BADGES = {
	'bfb4bbb19d5042138db3ae32f23c4aa2': {
		img: '/fluent-emoji/1f331.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'86d5a0fdb382426ab0f01a1a2a9c287f': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'7263a10c843d4c26986987850d9ce326': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'af59e72ebddf484a97f5333778a56e48': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'0dcc42f5aeb44e5eb79c4f1dd7100216': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'329670f100504846988729b1f392395e': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'47c1ccc95ba245df8bb1bf245bd9f517': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'814b0d6655ad4379a28f46b67c188559': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'ef26b5bd8e8b49438779f4a2c80de4ee': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'd046b1342f9d46c192f899be14cf614a': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'98c11358616746b7afbee3190851dfa4': {
		img: '/fluent-emoji/1f44c.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
	'8d770b0cdda648caa1b1ae920ecd19e6': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'dc7733a48033407082d20accffc74763': {
		img: '/fluent-emoji/1f6b8.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'1b2308ad4bec49deb62d24b62452c58c': {
		img: '/fluent-emoji/1f91d.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'c7f0e1f9df2c4798a3785501caef3d14': {
		img: '/fluent-emoji/1f4af.png',
		bg: 'linear-gradient(0deg, rgb(255 53 184), rgb(255 206 69))',
		frame: 'silver',
	},
	'560f644ae17b40c282f0ee90c9939f56': {
		img: '/fluent-emoji/1f970.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'f2c2ef3eed2a46e2928a3b90ea763c2d': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'b158c3154a9244779d644af4a7b3907d': {
		img: '/fluent-emoji/1f44b.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'e1fb8e59f4fc4a0f9d7e5747a103ff16': {
		img: '/fluent-emoji/1f411.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'bronze',
	},
	'3dc5e086638e414e9bd9f605a46cbb5a': {
		img: '/fluent-emoji/1f396.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'db2496a32a9c47a2ace6271fb10c9890': {
		img: '/fluent-emoji/1f3c6.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'4d5abaebc2924792a97d548d4c7c09fe': {
		img: '/fluent-emoji/1f4e1.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'gold',
	},
	'ba6688fa24a3475185a460d11dad47b2': {
		img: '/fluent-emoji/1f451.png',
		bg: 'linear-gradient(0deg, rgb(255 232 119), rgb(255 140 41))',
		frame: 'gold',
	},
	'30d049b4deeb4d1382a6702307fd9b8a': {
		img: '/fluent-emoji/2764.png',
		bg: 'linear-gradient(0deg, rgb(255 77 77), rgb(247 155 214))',
		frame: 'silver',
	},
	'098fc6d1af604e9588cf2d637870355b': {
		img: '/fluent-emoji/1f552.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'455365961ef14786af76b15917b3accd': {
		img: '/fluent-emoji/1f319.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'e9abbdb33ce04a42b62798d4d001c614': {
		img: '/fluent-emoji/1f30a.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'52dff3050a4a430db49b8f943d03d8d4': {
		img: '/fluent-emoji/2753.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'173c61f28a934efbbc5342294b9a13a0': {
		img: '/fluent-emoji/2757.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'a7cb1d292c494008822d69fc02f95e4c': {
		img: '/fluent-emoji/1f340.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'silver',
	},
	'e3d7be8f803a47b698c38cc727e0462b': {
		img: '/fluent-emoji/1f36e.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
} as const satisfies Record<typeof ACHIEVEMENT_TYPES[number], {
	img: string;
	bg: string;
	frame: 'bronze' | 'silver' | 'gold';
}>;

export const claimedAchievements = ($i && $i.achievements) ? $i.achievements.map(x => x.name) : [];

export function claimAchievement(type: typeof ACHIEVEMENT_TYPES[number]) {
	if (claimedAchievements.includes(type)) return;
	os.api('i/claim-achievement', { name: type });
	claimedAchievements.push(type);
}
