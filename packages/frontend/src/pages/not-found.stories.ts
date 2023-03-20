import { Meta, Story } from '@storybook/vue3';
import not_found from './not-found.vue';
const meta = {
	title: 'pages/not-found',
	component: not_found,
};
export const Default = {
	components: {
		not_found,
	},
	template: '<not_found />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
