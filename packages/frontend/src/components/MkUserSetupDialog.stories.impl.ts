/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { commonHandlers } from '../../.storybook/mocks.js';
import { userDetailed } from '../../.storybook/fakes.js';
import MkUserSetupDialog from './MkUserSetupDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkUserSetupDialog,
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
			template: '<MkUserSetupDialog v-bind="props" />',
		};
	},
	args: {

	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users', (req, res, ctx) => {
					return res(ctx.json([
						userDetailed('44'),
						userDetailed('49'),
					]));
				}),
				rest.post('/api/pinned-users', (req, res, ctx) => {
					return res(ctx.json([
						userDetailed('44'),
						userDetailed('49'),
					]));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkUserSetupDialog>;
