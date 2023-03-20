import { Meta, Story } from '@storybook/vue3';
import MkWidgets from './MkWidgets.vue';
const meta = {
	title: 'components/MkWidgets',
	component: MkWidgets,
};
export const Default = {
	components: {
		MkWidgets,
	},
	template: '<MkWidgets />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
