/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { StoryObj } from '@storybook/vue3';
import { action } from '@storybook/addon-actions';
import MkCwButton from './MkCwButton.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkCwButton,
			},
			data() {
				return {
					showContent: false,
				};
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
						'update:modelValue': action('update:modelValue'),
					};
				},
			},
			template: '<MkCwButton v-model="showContent" v-bind="props" v-on="events" />',
		};
	},
	args: {
		text: 'Some CW content',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCwButton>;
