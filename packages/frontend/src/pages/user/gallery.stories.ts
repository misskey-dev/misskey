import { Meta, Story } from '@storybook/vue3';
import gallery from './gallery.vue';
const meta = {
	title: 'pages/user/gallery',
	component: gallery,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				gallery,
			},
			props: Object.keys(argTypes),
			template: '<gallery v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
