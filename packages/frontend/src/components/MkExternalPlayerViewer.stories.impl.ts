/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { action } from 'storybook/actions';
import MkExternalPlayerViewer from './MkExternalPlayerViewer.vue';
import type { StoryObj } from '@storybook/vue3';

export const Default = {
	render(args) {
		return {
			components: { MkExternalPlayerViewer },
			setup() {
				return { args, onClosed: action('closed') };
			},
			template: '<MkExternalPlayerViewer v-bind="args" @closed="onClosed"/>',
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
		url: 'https://example.com/',
		returnFocusTo: null,
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof MkExternalPlayerViewer>;
