/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { delay, http, HttpResponse } from 'msw';
import { StoryObj } from '@storybook/vue3';
import { entities } from 'misskey-js';
import { commonHandlers } from '../../../.storybook/mocks.js';
import { emoji } from '../../../.storybook/fakes.js';
import custom_emojis_manager2 from './custom-emojis-manager2.vue';

function createRender(params: {
	emojis: entities.EmojiDetailedAdmin[];
}) {
	return {
		render(args) {
			return {
				components: {
					custom_emojis_manager2,
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
				template: '<custom_emojis_manager2 v-bind="props" />',
			};
		},
		args: {

		},
		parameters: {
			layout: 'fullscreen',
			msw: {
				handlers: [
					...commonHandlers,
					http.post('/api/admin/emoji/v2/list', async (req) => {
						await delay(100);

						const bodyStream = req.request.body as ReadableStream;
						const body = await new Response(bodyStream).json() as entities.AdminEmojiV2ListRequest;

						const emojis = params.emojis;
						const limit = body.limit ?? 10;
						const page = body.page ?? 1;
						const result = emojis.slice((page - 1) * limit, page * limit);

						return HttpResponse.json({
							emojis: result,
							count: Math.min(emojis.length, limit),
							allCount: emojis.length,
							allPages: Math.ceil(emojis.length / limit),
						});
					}),
				],
			},
		},
	} satisfies StoryObj<typeof custom_emojis_manager2>;
}

export const Default = createRender({
	emojis: [],
});

export const List10 = createRender({
	emojis: Array.from({ length: 10 }, (_, i) => emoji({ name: `emoji_${i}` })),
});

export const List100 = createRender({
	emojis: Array.from({ length: 100 }, (_, i) => emoji({ name: `emoji_${i}` })),
});

export const List1000 = createRender({
	emojis: Array.from({ length: 1000 }, (_, i) => emoji({ name: `emoji_${i}` })),
});
