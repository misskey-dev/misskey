/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import MkAbuseReportResolver from './MkAbuseReportResolver.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkAbuseReportResolver,
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
			template: '<MkAbuseReportResolver v-bind="props" />',
		};
	},
	args: {
		editable: true,
		data: {
			name: 'Sample',
			targetUserPattern: '^.*@.+$',
			reporterPattern: null,
			reportContentPattern: null,
			expiresAt: 'indefinitely',
			forward: false,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAbuseReportResolver>;
