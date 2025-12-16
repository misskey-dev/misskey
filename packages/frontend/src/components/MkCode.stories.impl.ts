/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkCode from './MkCode.vue';

const code = `for (let i, 100) {
	<: if (i % 15 == 0) "FizzBuzz"
		elif (i % 3 == 0) "Fizz"
		elif (i % 5 == 0) "Buzz"
		else i
}`;
export const Default = {
	render(args) {
		return {
			components: {
				MkCode,
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
			template: '<MkCode v-bind="props" />',
		};
	},
	args: {
		code,
		lang: 'is',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCode>;
