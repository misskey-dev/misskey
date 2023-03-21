/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import statusbar_ from './statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar',
	component: statusbar_,
} satisfies Meta<typeof statusbar_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof statusbar_>;
export default meta;
