/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../../.storybook/fakes';
import { commonHandlers } from '../../../.storybook/mocks';
import home_ from './home.vue';
export const Default = {
	render(args) {
		return {
			components: {
				home_,
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
			template: '<home_ v-bind="props" />',
		};
	},
	args: {
		user: userDetailed(),
		disableNotes: false,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/notes', (req, res, ctx) => {
					return res(ctx.json([]));
				}),
				rest.get('/api/charts/user/notes', (req, res, ctx) => {
					const length = Math.max(Math.min(parseInt(req.url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return res(ctx.json({
						total: Array.from({ length }, () => 0),
						inc: Array.from({ length }, () => 0),
						dec: Array.from({ length }, () => 0),
						diffs: {
							normal: Array.from({ length }, () => 0),
							reply: Array.from({ length }, () => 0),
							renote: Array.from({ length }, () => 0),
							withFile: Array.from({ length }, () => 0),
						},
					}));
				}),
				rest.get('/api/charts/user/pv', (req, res, ctx) => {
					const length = Math.max(Math.min(parseInt(req.url.searchParams.get('limit') ?? '30', 10), 1), 300);
					return res(ctx.json({
						upv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
						pv: {
							user: Array.from({ length }, () => 0),
							visitor: Array.from({ length }, () => 0),
						},
					}));
				}),
			],
		},
		chromatic: {
			// `XActivity` is not compatible with Chromatic for now
			disableSnapshot: true,
		},
	},
} satisfies StoryObj<typeof home_>;
