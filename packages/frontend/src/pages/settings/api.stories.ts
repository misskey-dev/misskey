import { Meta, StoryObj } from '@storybook/vue3';
import api_ from './api.vue';
const meta = {
	title: 'pages/settings/api',
	component: api_,
} satisfies Meta<typeof api_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				api_,
			},
			props: Object.keys(argTypes),
			template: '<api_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof api_>;
export default meta;
