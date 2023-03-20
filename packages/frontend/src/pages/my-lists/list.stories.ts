import { Meta, Story } from '@storybook/vue3';
import list from './list.vue';
const meta = {
	title: 'pages/my-lists/list',
	component: list,
};
export const Default = {
	components: {
		list,
	},
	template: '<list />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
