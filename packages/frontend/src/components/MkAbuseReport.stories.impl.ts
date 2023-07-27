/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { abuseUserReport } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
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
				rest.post('/api/admin/resolve-abuse-user-report', async (req, res, ctx) => {
					action('POST /api/admin/resolve-abuse-user-report')(await req.json());
					return res(ctx.json({}));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAbuseReport>;
