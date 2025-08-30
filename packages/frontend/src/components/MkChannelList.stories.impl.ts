/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse, http } from 'msw';
import { action } from 'storybook/actions';
import { channel } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkChannelList from './MkChannelList.vue';
import type { StoryObj } from '@storybook/vue3';
import { Paginator } from '@/utility/paginator.js';
export const Default = {
	render(args) {
		return {
			components: {
				MkChannelList,
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
			template: '<MkChannelList v-bind="props" />',
		};
	},
	args: {
		paginator: new Paginator('channels/search', {}),
	},
	parameters: {
		chromatic: {
			// NOTE: ロードが終わるまで待つ
			delay: 3000,
		},
		layout: 'fullscreen',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/channels/search', async ({ request, params }) => {
					action('POST /api/channels/search')(await request.json());
					return HttpResponse.json(params.untilId === 'lastchannel' ? [] : [
						channel(),
						channel('lastchannel', 'Last Channel', null),
					]);
				}),
			],
		},
	},
	decorators: [
		() => ({
			template: '<div style="display: flex; align-items: center; justify-content: center; height: 100vh"><div style="max-width: 700px; width: 100%; margin: 3rem"><story/></div></div>',
		}),
	],
} satisfies StoryObj<typeof MkChannelList>;
