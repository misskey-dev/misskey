import { Meta, Story } from '@storybook/vue3';
import statusbar_rss from './statusbar-rss.vue';
const meta = {
	title: 'ui/_common_/statusbar-rss',
	component: statusbar_rss,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				statusbar_rss,
			},
			props: Object.keys(argTypes),
			template: '<statusbar_rss v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
