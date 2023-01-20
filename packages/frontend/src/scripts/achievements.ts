import * as os from '@/os';
import { $i } from '@/account';

export const ACHIEVEMENT_TYPES = [
	'notes1',
	'notes10',
	'notes100',
	'notes500',
	'notes1000',
	'notes5000',
	'notes10000',
	'notes20000',
	'notes30000',
	'notes40000',
	'notes50000',
	'profileFilled',
	'following1',
	'following10',
	'following50',
	'following100',
	'following300',
	'followers1',
	'followers10',
	'followers50',
	'followers100',
	'followers300',
	'followers500',
	'followers1000',
	'iLoveMisskey',
	'client30min',
	'postedAtLateNight',
	'htl20npm',
	'reactWithoutRead',
	'clickedClickHere',
	'justPlainLucky',
	'setNameToSyuilo',
	'passedSinceAccountCreated1',
] as const;

export const ACHIEVEMENT_BADGES = {
	'notes1': {
		img: '/fluent-emoji/1f331.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'notes10': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'notes100': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'notes500': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'notes1000': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'notes5000': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'notes10000': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'notes20000': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'notes30000': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'notes40000': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'notes50000': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'profileFilled': {
		img: '/fluent-emoji/1f44c.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
	'following1': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'following10': {
		img: '/fluent-emoji/1f6b8.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'following50': {
		img: '/fluent-emoji/1f91d.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'following100': {
		img: '/fluent-emoji/1f4af.png',
		bg: 'linear-gradient(0deg, rgb(255 53 184), rgb(255 206 69))',
		frame: 'silver',
	},
	'following300': {
		img: '/fluent-emoji/1f970.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'followers1': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'followers10': {
		img: '/fluent-emoji/1f44b.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'followers50': {
		img: '/fluent-emoji/1f411.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'bronze',
	},
	'followers100': {
		img: '/fluent-emoji/1f396.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'followers300': {
		img: '/fluent-emoji/1f3c6.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'followers500': {
		img: '/fluent-emoji/1f4e1.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'gold',
	},
	'followers1000': {
		img: '/fluent-emoji/1f451.png',
		bg: 'linear-gradient(0deg, rgb(255 232 119), rgb(255 140 41))',
		frame: 'gold',
	},
	'iLoveMisskey': {
		img: '/fluent-emoji/2764.png',
		bg: 'linear-gradient(0deg, rgb(255 77 77), rgb(247 155 214))',
		frame: 'silver',
	},
	'client30min': {
		img: '/fluent-emoji/1f552.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'postedAtLateNight': {
		img: '/fluent-emoji/1f319.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'htl20npm': {
		img: '/fluent-emoji/1f30a.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'reactWithoutRead': {
		img: '/fluent-emoji/2753.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'clickedClickHere': {
		img: '/fluent-emoji/2757.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'justPlainLucky': {
		img: '/fluent-emoji/1f340.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'silver',
	},
	'setNameToSyuilo': {
		img: '/fluent-emoji/1f36e.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
	'passedSinceAccountCreated1': {
		img: '/fluent-emoji/0031-20e3.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'silver',
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
