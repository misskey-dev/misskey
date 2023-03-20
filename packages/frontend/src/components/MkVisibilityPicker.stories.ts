import { Meta, Story } from '@storybook/vue3';
import MkVisibilityPicker from './MkVisibilityPicker.vue';
const meta = {
	title: 'components/MkVisibilityPicker',
	component: MkVisibilityPicker,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkVisibilityPicker,
			},
			props: Object.keys(argTypes),
			template: '<MkVisibilityPicker v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
