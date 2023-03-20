import { Meta, Story } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'pages/settings/index',
	component: index,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index,
			},
			props: Object.keys(argTypes),
			template: '<index v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
