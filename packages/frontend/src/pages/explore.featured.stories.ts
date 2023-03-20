import { Meta, Story } from '@storybook/vue3';
import explore_featured from './explore.featured.vue';
const meta = {
	title: 'pages/explore.featured',
	component: explore_featured,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore_featured,
			},
			props: Object.keys(argTypes),
			template: '<explore_featured v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
