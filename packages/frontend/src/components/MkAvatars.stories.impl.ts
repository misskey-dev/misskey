/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkAvatars from './MkAvatars.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAvatars,
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
			template: '<MkAvatars v-bind="props" />',
		};
	},
	args: {
		userIds: ['17', '20', '18'],
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/show', (req, res, ctx) => {
					return res(ctx.json([
						userDetailed('17'),
						userDetailed('20'),
						userDetailed('18'),
					]));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAvatars>;
