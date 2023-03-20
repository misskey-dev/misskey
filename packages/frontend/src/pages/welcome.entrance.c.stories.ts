import { Meta, Story } from '@storybook/vue3';
import welcome_entrance_c from './welcome.entrance.c.vue';
const meta = {
	title: 'pages/welcome.entrance.c',
	component: welcome_entrance_c,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_entrance_c,
			},
			props: Object.keys(argTypes),
			template: '<welcome_entrance_c v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
