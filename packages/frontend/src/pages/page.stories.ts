import { Meta, Story } from '@storybook/vue3';
import page from './page.vue';
const meta = {
	title: 'pages/page',
	component: page,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page,
			},
			props: Object.keys(argTypes),
			template: '<page v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
