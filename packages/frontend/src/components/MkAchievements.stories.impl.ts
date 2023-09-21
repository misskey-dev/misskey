/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import { rest } from 'msw';
import { userDetailed } from '../../.storybook/fakes';
import { commonHandlers } from '../../.storybook/mocks';
import MkAchievements from './MkAchievements.vue';
import { ACHIEVEMENT_TYPES } from '@/scripts/achievements.js';
export const Empty = {
	render(args) {
		return {
			components: {
				MkAchievements,
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
			template: '<MkAchievements v-bind="props" />',
		};
	},
	args: {
		user: userDetailed(),
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/achievements', (req, res, ctx) => {
					return res(ctx.json([]));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAchievements>;
export const All = {
	...Empty,
	parameters: {
		msw: {
			handlers: [
				...commonHandlers,
				rest.post('/api/users/achievements', (req, res, ctx) => {
					return res(ctx.json(ACHIEVEMENT_TYPES.map((name) => ({ name, unlockedAt: 0 }))));
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkAchievements>;
