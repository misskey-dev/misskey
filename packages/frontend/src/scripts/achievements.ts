import * as os from '@/os';
import { $i } from '@/account';

export const ACHIEVEMENT_TYPES = [
	'justSettingUpMyMsky',
	'beginnerI',
	'beginnerII',
	'beginnerIII',
	'misskistI',
	'misskistII',
	'misskistIII',
	'noteMasterI',
	'noteMasterII',
	'noteMasterIII',
	'iAmReady',
	'myFirstFollow',
	'iFollowYou',
	'manyFriends',
	'100Friends',
	'tooManyFriends',
	'myFirstFollower',
	'followMe',
	'inDroves',
	'youArePopular',
	'pleaseStandInLine',
	'baseStation',
	'influencer',
	'iLoveMisskey',
	'takeABreak',
	'nocturnality',
	'flowingTimeline',
	'haveYouReadIt',
	'clickHere',
	'justPlainLucky',
	'godComplex',
] as const;

export const ACHIEVEMENT_BADGES = {
	'justSettingUpMyMsky': {
		img: '/fluent-emoji/1f331.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'beginnerI': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'beginnerII': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'beginnerIII': {
		img: '/fluent-emoji/1fab4.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'misskistI': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'misskistII': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'misskistIII': {
		img: '/fluent-emoji/1f333.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'silver',
	},
	'noteMasterI': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'noteMasterII': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'noteMasterIII': {
		img: '/fluent-emoji/1f304.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'gold',
	},
	'iAmReady': {
		img: '/fluent-emoji/1f44c.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'bronze',
	},
	'myFirstFollow': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'iFollowYou': {
		img: '/fluent-emoji/1f6b8.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'manyFriends': {
		img: '/fluent-emoji/1f91d.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'100Friends': {
		img: '/fluent-emoji/1f4af.png',
		bg: 'linear-gradient(0deg, rgb(255 53 184), rgb(255 206 69))',
		frame: 'silver',
	},
	'tooManyFriends': {
		img: '/fluent-emoji/1f970.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'myFirstFollower': {
		img: '/fluent-emoji/2618.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'followMe': {
		img: '/fluent-emoji/1f44b.png',
		bg: 'linear-gradient(0deg, rgb(59 187 116), rgb(199 211 102))',
		frame: 'bronze',
	},
	'inDroves': {
		img: '/fluent-emoji/1f411.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'bronze',
	},
	'youArePopular': {
		img: '/fluent-emoji/1f396.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'pleaseStandInLine': {
		img: '/fluent-emoji/1f3c6.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'silver',
	},
	'baseStation': {
		img: '/fluent-emoji/1f4e1.png',
		bg: 'linear-gradient(0deg, rgb(220 223 225), rgb(172 192 207))',
		frame: 'gold',
	},
	'influencer': {
		img: '/fluent-emoji/1f451.png',
		bg: 'linear-gradient(0deg, rgb(255 232 119), rgb(255 140 41))',
		frame: 'gold',
	},
	'iLoveMisskey': {
		img: '/fluent-emoji/2764.png',
		bg: 'linear-gradient(0deg, rgb(255 77 77), rgb(247 155 214))',
		frame: 'silver',
	},
	'takeABreak': {
		img: '/fluent-emoji/1f552.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'nocturnality': {
		img: '/fluent-emoji/1f319.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'flowingTimeline': {
		img: '/fluent-emoji/1f30a.png',
		bg: 'linear-gradient(0deg, rgb(197 69 192), rgb(2 112 155))',
		frame: 'bronze',
	},
	'haveYouReadIt': {
		img: '/fluent-emoji/2753.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'clickHere': {
		img: '/fluent-emoji/2757.png',
		bg: 'linear-gradient(0deg, rgb(144 224 255), rgb(255 168 252))',
		frame: 'bronze',
	},
	'justPlainLucky': {
		img: '/fluent-emoji/1f340.png',
		bg: 'linear-gradient(0deg, rgb(187 183 59), rgb(255 143 77))',
		frame: 'silver',
	},
	'godComplex': {
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
