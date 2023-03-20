import { Meta, Story } from '@storybook/vue3';
import flash_index from './flash-index.vue';
const meta = {
	title: 'pages/flash/flash-index',
	component: flash_index,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				flash_index,
			},
			props: Object.keys(argTypes),
			template: '<flash_index v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
