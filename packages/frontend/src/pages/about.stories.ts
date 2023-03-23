/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import about_ from './about.vue';
const meta = {
	title: 'pages/about',
	component: about_,
} satisfies Meta<typeof about_>;
export const Default = {
	render(args) {
		return {
			components: {
				about_,
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
			template: '<about_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof about_>;
export default meta;
