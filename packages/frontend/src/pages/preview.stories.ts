import { Meta, Story } from '@storybook/vue3';
import preview from './preview.vue';
const meta = {
	title: 'pages/preview',
	component: preview,
};
export const Default = {
	components: {
		preview,
	},
	template: '<preview />',
};
export default meta;
