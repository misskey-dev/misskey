/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { StoryObj } from '@storybook/vue3';
import { userDetailed } from '../../.storybook/fakes.js';
import MkUserSetupDialog_User from './MkUserSetupDialog.User.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog_User,
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
			template: '<MkUserSetupDialog_User v-bind="props" />',
		};
	},
	args: {
		user: userDetailed(),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSetupDialog_User>;
