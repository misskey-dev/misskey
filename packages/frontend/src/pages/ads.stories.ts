import { Meta, Story } from '@storybook/vue3';
import ads from './ads.vue';
const meta = {
	title: 'pages/ads',
	component: ads,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				ads,
			},
			props: Object.keys(argTypes),
			template: '<ads v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
