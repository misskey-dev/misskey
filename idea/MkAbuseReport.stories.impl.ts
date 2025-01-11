/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { abuseUserReport } from '../packages/frontend/.storybook/fakes.js';
import { commonHandlers } from '../packages/frontend/.storybook/mocks.js';
import MkAbuseReport from './MkAbuseReport.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAbuseReport,
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
						resolved: action('resolved'),
					};
				},
			},
			template: '<MkAbuseReport v-bind="props" v-on="events" />',
		};
	},
	args: {
		report: abuseUserReport(),
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/admin/resolve-abuse-user-report', async ({ request }) => {
					action('POST /api/admin/resolve-abuse-user-report')(await request.json());
					return HttpResponse.json({});
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAbuseReport>;
