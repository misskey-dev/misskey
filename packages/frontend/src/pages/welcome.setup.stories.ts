import { Meta, Story } from '@storybook/vue3';
import welcome_setup from './welcome.setup.vue';
const meta = {
	title: 'pages/welcome.setup',
	component: welcome_setup,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_setup,
			},
			props: Object.keys(argTypes),
			template: '<welcome_setup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
