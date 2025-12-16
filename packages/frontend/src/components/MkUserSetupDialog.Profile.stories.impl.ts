/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import MkUserSetupDialog_Profile from './MkUserSetupDialog.Profile.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog_Profile,
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
			template: '<MkUserSetupDialog_Profile v-bind="props" />',
		};
	},
	args: {

	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog_Profile>;
