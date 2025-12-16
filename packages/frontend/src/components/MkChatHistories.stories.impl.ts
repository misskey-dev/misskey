/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { action } from 'storybook/actions';
import type { StoryObj } from '@storybook/vue3';
import type * as Misskey from 'misskey-js';
import { HttpResponse, http } from 'msw';
import { chatMessage } from '../../.storybook/fakes';
import MkChatHistories from './MkChatHistories.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkChatHistories,
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
			template: '<MkChatHistories v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				http.post('/api/chat/history', async ({ request }) => {
					const body = await request.json() as Misskey.entities.ChatHistoryRequest;
					action('POST /api/chat/history')(body);
					return HttpResponse.json([chatMessage(body.room)]);
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkChatHistories>;
