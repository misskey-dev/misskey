import { Meta, Story } from '@storybook/vue3';
import welcome from './welcome.vue';
const meta = {
	title: 'pages/welcome',
	component: welcome,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome,
			},
			props: Object.keys(argTypes),
			template: '<welcome v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
