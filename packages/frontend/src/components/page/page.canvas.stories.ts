import { Meta, Story } from '@storybook/vue3';
import page_canvas from './page.canvas.vue';
const meta = {
	title: 'components/page/page.canvas',
	component: page_canvas,
};
export const Default = {
	components: {
		page_canvas,
	},
	template: '<page_canvas />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
