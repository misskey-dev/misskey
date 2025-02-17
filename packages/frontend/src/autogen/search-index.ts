
// vue-props-analyzer によって自動生成されたファイルです。
// 編集はしないでください。

import { i18n } from '@/i18n'; //  i18n のインポート

export const searchIndexes = [
	{
		filePath: 'src/pages/settings/profile.vue',
		usage: [
			{
				parentFile: 'src/pages/settings/profile.vue',
				staticProps: {
					markerId: '727cc9e8-ad67-474a-9241-b5a9a6475e47',
				},
				bindProps: {},
				componentName: 'MkSearchMarker',
			},
			{
				parentFile: 'src/pages/settings/profile.vue',
				staticProps: {
					markerId: '1a06c7f9-e85e-46cb-bf5f-b3efa8e71b93',
				},
				bindProps: {},
				componentName: 'MkSearchMarker',
			},
		],
	},
	{
		filePath: 'src/pages/settings/privacy.vue',
		usage: [
			{
				parentFile: 'src/pages/settings/privacy.vue',
				staticProps: {
					icon: 'ti ti-lock-open',
				},
				bindProps: {
					locationLabel: [i18n.ts.privacy, i18n.ts.makeFollowManuallyApprove],
					keywords: ['follow', 'lock', i18n.ts.lockedAccountInfo],
				},
				componentName: 'MkSearchMarker',
			},
		],
	},
	{
		filePath: 'src/pages/settings/mute-block.vue',
		usage: [
			{
				parentFile: 'src/pages/settings/mute-block.vue',
				staticProps: {
					markerId: 'test',
					icon: 'ti ti-ban',
				},
				bindProps: {
					locationLabel: [i18n.ts.muteAndBlock],
					keywords: ['mute', i18n.ts.wordMute],
					children: ['test2'],
				},
				componentName: 'MkSearchMarker',
			},
		],
	},
] as const;

export type AnalysisResults = typeof searchIndexes;
export type ComponentUsageInfo = AnalysisResults[number]['usage'][number];
