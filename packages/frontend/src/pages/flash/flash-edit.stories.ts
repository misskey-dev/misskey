import { Meta, Story } from '@storybook/vue3';
import flash_edit from './flash-edit.vue';
const meta = {
	title: 'pages/flash/flash-edit',
	component: flash_edit,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				flash_edit,
			},
			props: Object.keys(argTypes),
			template: '<flash_edit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
