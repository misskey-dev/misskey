import { Meta, Story } from '@storybook/vue3';
import pages from './pages.vue';
const meta = {
	title: 'pages/pages',
	component: pages,
};
export const Default = {
	components: {
		pages,
	},
	template: '<pages />',
};
export default meta;
