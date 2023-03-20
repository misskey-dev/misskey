import { Meta, Story } from '@storybook/vue3';
import pages from './pages.vue';
const meta = {
	title: 'pages/user/pages',
	component: pages,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				pages,
			},
			props: Object.keys(argTypes),
			template: '<pages v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
