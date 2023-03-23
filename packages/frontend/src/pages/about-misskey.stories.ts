/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import about_misskey from './about-misskey.vue';
const meta = {
	title: 'pages/about-misskey',
	component: about_misskey,
} satisfies Meta<typeof about_misskey>;
export const Default = {
	render(args) {
		return {
			components: {
				about_misskey,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<about_misskey v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof about_misskey>;
export default meta;
