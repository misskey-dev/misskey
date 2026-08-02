/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import MkExternalPlayer from './MkExternalPlayer.vue';
import type { StoryObj } from '@storybook/vue3';

export const Default = {
	render(args) {
		return {
			components: { MkExternalPlayer },
			setup() {
				return { args };
			},
			template: '<div style="width: min(640px, 100vw); aspect-ratio: 16 / 9;"><MkExternalPlayer v-bind="args"/></div>',
		};
	},
	args: {
		player: {
			url: 'https://example.com/',
			width: 640,
			height: 360,
			allow: ['fullscreen'],
		},
		title: 'External player',
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkExternalPlayer>;
