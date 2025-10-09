/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { waitFor } from '@storybook/test';
import MkPageHeader from './MkPageHeader.vue';
import type { StoryObj } from '@storybook/vue3';
export const Empty = {
	render(args) {
		return {
			components: {
				MkPageHeader,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...this.args,
					};
				},
			},
			template: '<MkPageHeader v-bind="props" />',
		};
	},
	async play() {
		const wait = new Promise((resolve) => window.setTimeout(resolve, 800));
		await waitFor(async () => await wait);
	},
	args: {
		tabs: [],
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const OneTab = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'sometabkey',
		tabs: [
			{
				key: 'sometabkey',
				title: 'Some Tab Title',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const Icon = {
	...OneTab,
	args: {
		...OneTab.args,
		tabs: [
			{
				...OneTab.args.tabs[0],
				icon: 'ti ti-home',
				title: 'Home',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const IconOnly = {
	...Icon,
	args: {
		...Icon.args,
		tabs: [
			{
				key: Icon.args.tabs[0].key,
				icon: Icon.args.tabs[0].icon,
				title: Icon.args.tabs[0].title,
				iconOnly: true,
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
export const SomeTabs = {
	...Empty,
	args: {
		...Empty.args,
		tab: 'princess',
		tabs: [
			{
				key: 'princess',
				title: 'Princess',
				icon: 'ti ti-crown',
			},
			{
				key: 'fairy',
				title: 'Fairy',
				icon: 'ti ti-snowflake',
			},
			{
				key: 'angel',
				title: 'Angel',
				icon: 'ti ti-feather',
			},
		],
	},
} satisfies StoryObj<typeof MkPageHeader>;
