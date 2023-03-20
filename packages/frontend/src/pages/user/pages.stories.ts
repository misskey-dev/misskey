import { Meta, Story } from '@storybook/vue3';
import pages from './pages.vue';
const meta = {
	title: 'pages/user/pages',
	component: pages,
};
export const Default = {
	components: {
		pages,
	},
	template: '<pages />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
