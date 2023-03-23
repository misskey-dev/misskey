/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import home_ from './home.vue';
const meta = {
	title: 'pages/user/home',
	component: home_,
} satisfies Meta<typeof home_>;
export const Default = {
	render(args) {
		return {
			components: {
				home_,
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
			template: '<home_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof home_>;
export default meta;
