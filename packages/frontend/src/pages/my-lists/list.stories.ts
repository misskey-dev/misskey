import { Meta, Story } from '@storybook/vue3';
import list from './list.vue';
const meta = {
	title: 'pages/my-lists/list',
	component: list,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				list,
			},
			props: Object.keys(argTypes),
			template: '<list v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
