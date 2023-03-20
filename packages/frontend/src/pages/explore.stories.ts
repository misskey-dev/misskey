import { Meta, Story } from '@storybook/vue3';
import explore from './explore.vue';
const meta = {
	title: 'pages/explore',
	component: explore,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				explore,
			},
			props: Object.keys(argTypes),
			template: '<explore v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
