import * as os from '@/os';
import { $i } from '@/account';

export const ACHIEVEMENT_TYPES = [
	'justSettingUpMyMsky',
	'iAmReady',
	'myFirstFollow',
	'myFirstFollower',
	'iLoveMisskey',
	'nocturnality',
	'haveYouReadIt',
	'clickHere',
	'justPlainLucky',
	'godComplex',
] as const;

export const ACHIEVEMENT_BADGES = {
	justSettingUpMyMsky: {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	iAmReady: {
		img: '/fluent-emoji/1f44c.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
	myFirstFollow: {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	myFirstFollower: {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	iLoveMisskey: {
		img: '/fluent-emoji/2764.png',
		bg: 'linear-gradient(0deg, rgb(255 77 77), rgb(247 155 214))',
		frame: 'silver',
	},
	nocturnality: {
		img: '/fluent-emoji/1f319.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	haveYouReadIt: {
		img: '/fluent-emoji/2753.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	clickHere: {
		img: '/fluent-emoji/2757.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	justPlainLucky: {
		img: '/fluent-emoji/1f340.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'silver',
	},
	godComplex: {
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
