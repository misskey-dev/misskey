/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import favorites_ from './favorites.vue';
const meta = {
	title: 'pages/favorites',
	component: favorites_,
} satisfies Meta<typeof favorites_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				favorites_,
			},
			props: Object.keys(argTypes),
			template: '<favorites_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof favorites_>;
export default meta;
