/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { StoryObj } from '@storybook/vue3';
import { HttpResponse, http } from 'msw';
import { action } from '@storybook/addon-actions';
import { channel } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkChannelFollowButton from './MkChannelFollowButton.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkChannelFollowButton,
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
			template: '<MkChannelFollowButton v-bind="props" />',
		};
	},
	args: {
		channel: channel(),
		full: true,
	},
	parameters: {
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.post('/api/channels/follow', async ({ request }) => {
					action('POST /api/channels/follow')(await request.json());
					return HttpResponse.json({});
				}),
				http.post('/api/channels/unfollow', async ({ request }) => {
					action('POST /api/channels/unfollow')(await request.json());
					return HttpResponse.json({});
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkChannelFollowButton>;
