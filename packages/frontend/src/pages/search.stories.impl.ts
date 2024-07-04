/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import search_ from './search.vue';
import { userDetailed } from '@/../.storybook/fakes.js';
import { commonHandlers } from '@/../.storybook/mocks.js';

export const Default = {
	render(args) {
		return {
			components: {
				search_,
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
			template: '<search_ v-bind="props" />',
		};
	},
	args: {},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', () => {
					return HttpResponse.json(userDetailed());
				}),
			],
		},
	},
} satisfies StoryObj<typeof search_>;

export const WithUsername = {
	...Default,
	args: {
		username: userDetailed().username,
		host: userDetailed().host,
	},
} satisfies StoryObj<typeof search_>;

const localUser = userDetailed('someuserid', 'miskist', null, 'Local Misskey User');

export const WithUsernameLocal = {
	...Default,

	args: {
		username: localUser.username,
		host: localUser.host,
	},
	parameters: {
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/users/show', () => {
					return HttpResponse.json(localUser);
				}),
			],
		},
	},
} satisfies StoryObj<typeof search_>;
