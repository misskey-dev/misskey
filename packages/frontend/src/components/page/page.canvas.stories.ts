import { Meta, Story } from '@storybook/vue3';
import page_canvas from './page.canvas.vue';
const meta = {
	title: 'components/page/page.canvas',
	component: page_canvas,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_canvas,
			},
			props: Object.keys(argTypes),
			template: '<page_canvas v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
