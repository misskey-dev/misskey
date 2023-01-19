import * as os from '@/os';
import { $i } from '@/account';

export const ACHIEVEMENT_TYPES = [
	'justSettingUpMyMsky',
	'myFirstFollow',
	'myFirstFollower',
	'iLoveMisskey',
	'nocturnality',
	'haveYouReadIt',
] as const;

export const ACHIEVEMENT_BADGES = {
	justSettingUpMyMsky: {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, #277058, #9ad366)',
		frame: 'bronze',
	},
	myFirstFollow: {
		img: '/fluent-emoji/2618.png',
		bg: '',
		frame: 'bronze',
	},
	myFirstFollower: {
		img: '/fluent-emoji/2618.png',
		bg: '',
		frame: 'bronze',
	},
	iLoveMisskey: {
		img: '/fluent-emoji/2764.png',
		bg: 'linear-gradient(0deg, rgb(112 39 56), rgb(211 102 137))',
		frame: 'bronze',
	},
	nocturnality: {
		img: '/fluent-emoji/2618.png',
		bg: '',
		frame: 'bronze',
	},
	haveYouReadIt: {
		img: '/fluent-emoji/2618.png',
		bg: '',
		frame: 'bronze',
	},
} as const;

export const claimedAchievements = ($i && $i.achievements) ? $i.achievements.map(x => x.name) : [];

export function claimAchievement(type: typeof ACHIEVEMENT_TYPES[number]) {
	if (claimedAchievements.includes(type)) return;
	os.api('i/claim-achievement', { name: type });
	claimedAchievements.push(type);
}
