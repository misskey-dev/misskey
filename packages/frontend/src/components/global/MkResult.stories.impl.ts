/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import MkResult from './MkResult.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkResult,
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
			template: '<MkResult v-bind="props" />',
		};
	},
	args: {
		type: 'empty',
		text: 'Lorem Ipsum',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkResult>;
export const emptyWithNoText = {
	...Default,
	args: {
		...Default.args,
		text: undefined,
	},
} satisfies StoryObj<typeof MkResult>;
export const notFound = {
	...Default,
	args: {
		...Default.args,
		type: 'notFound',
	},
} satisfies StoryObj<typeof MkResult>;
export const errorType = {
	...Default,
	args: {
		...Default.args,
		type: 'error',
	},
} satisfies StoryObj<typeof MkResult>;
