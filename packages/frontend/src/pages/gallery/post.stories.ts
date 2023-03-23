/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import post_ from './post.vue';
const meta = {
	title: 'pages/gallery/post',
	component: post_,
} satisfies Meta<typeof post_>;
export const Default = {
	render(args) {
		return {
			components: {
				post_,
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
			template: '<post_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof post_>;
export default meta;
