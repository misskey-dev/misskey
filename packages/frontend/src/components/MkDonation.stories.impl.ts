/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import MkDonation from './MkDonation.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkDonation,
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
				events() {
					return {
						closed: action('closed'),
					};
				},
			},
			template: '<MkDonation v-bind="props" v-on="events" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkDonation>;
