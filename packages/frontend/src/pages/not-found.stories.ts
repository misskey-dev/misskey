import { Meta, Story } from '@storybook/vue3';
import not_found from './not-found.vue';
const meta = {
	title: 'pages/not-found',
	component: not_found,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				not_found,
			},
			props: Object.keys(argTypes),
			template: '<not_found v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
