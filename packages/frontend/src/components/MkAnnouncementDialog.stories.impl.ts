/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import MkAnnouncementDialog from './MkAnnouncementDialog.vue';
export const Default = {
	render(args) {
		return {
			components: {
				MkAnnouncementDialog,
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
			template: '<MkAnnouncementDialog v-bind="props" />',
		};
	},
	args: {
		announcement: {
			id: '1',
			title: 'Title',
			text: 'Text',
			createdAt: new Date().toISOString(),
			updatedAt: null,
			icon: 'info',
			imageUrl: null,
			display: 'dialog',
			needConfirmationToRead: false,
			forYou: true,
		},
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAnnouncementDialog>;
