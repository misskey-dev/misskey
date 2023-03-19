import { Meta, Story } from '@storybook/vue3';
import statusbar_rss from './statusbar-rss.vue';
const meta = {
	title: 'ui/_common_/statusbar-rss',
	component: statusbar_rss,
};
export const Default = {
	components: {
		statusbar_rss,
	},
	template: '<statusbar-rss />',
};
export default meta;
