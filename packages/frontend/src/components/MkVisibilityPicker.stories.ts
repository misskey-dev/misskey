import { Meta, Story } from '@storybook/vue3';
import MkVisibilityPicker from './MkVisibilityPicker.vue';
const meta = {
	title: 'components/MkVisibilityPicker',
	component: MkVisibilityPicker,
};
export const Default = {
	components: {
		MkVisibilityPicker,
	},
	template: '<MkVisibilityPicker />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
