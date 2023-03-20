import { Meta, StoryObj } from '@storybook/vue3';
import statusbar from './statusbar.vue';
const meta = {
	title: 'pages/settings/statusbar',
	component: statusbar,
} satisfies Meta<typeof statusbar>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar,
			},
			props: Object.keys(argTypes),
			template: '<statusbar v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof statusbar>;
export default meta;
