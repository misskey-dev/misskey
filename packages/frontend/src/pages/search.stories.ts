import { Meta, Story } from '@storybook/vue3';
import search from './search.vue';
const meta = {
	title: 'pages/search',
	component: search,
};
export const Default = {
	components: {
		search,
	},
	template: '<search />',
};
export default meta;
