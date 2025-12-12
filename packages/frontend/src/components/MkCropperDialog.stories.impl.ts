/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { HttpResponse, http } from 'msw';
import { action } from 'storybook/actions';
import { file } from '../../.storybook/fakes.js';
import { commonHandlers } from '../../.storybook/mocks.js';
import MkCropperDialog from './MkCropperDialog.vue';
import type { StoryObj } from '@storybook/vue3';
export const Default = {
	render(args) {
		return {
			components: {
				MkCropperDialog,
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
						'ok': action('ok'),
						'cancel': action('cancel'),
						'closed': action('closed'),
					};
				},
			},
			template: '<MkCropperDialog v-bind="props" v-on="events" />',
		};
	},
	args: {
		imageFile: new File([], 'image.webp', { type: 'image/webp' }),
		aspectRatio: NaN,
	},
	parameters: {
		chromatic: {
			// NOTE: ロードが終わるまで待つ
			delay: 3000,
		},
		layout: 'centered',
		msw: {
			handlers: [
				...commonHandlers,
				http.get('/proxy/image.webp', async ({ request }) => {
					const url = new URL(request.url).searchParams.get('url');
					if (url === 'https://github.com/misskey-dev/misskey/blob/master/packages/frontend/assets/fedi.jpg?raw=true') {
						const image = await (await window.fetch('client-assets/fedi.jpg')).blob();
						return new HttpResponse(image, {
							headers: {
								'Content-Type': 'image/jpeg',
							},
						});
					} else {
						return new HttpResponse(null, { status: 404 });
					}
				}),
				http.post('/api/drive/files/create', async ({ request }) => {
					action('POST /api/drive/files/create')(await request.formData());
					return HttpResponse.json(file());
				}),
			],
		},
	},
} satisfies StoryObj<typeof MkCropperDialog>;
