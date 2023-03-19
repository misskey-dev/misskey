import { Meta, Story } from '@storybook/vue3';
import explore_featured from './explore.featured.vue';
const meta = {
	title: 'pages/explore.featured',
	component: explore_featured,
};
export const Default = {
	components: {
		explore_featured,
	},
	template: '<explore.featured />',
};
export default meta;
