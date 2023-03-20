import { Meta, Story } from '@storybook/vue3';
import MkWindow from './MkWindow.vue';
const meta = {
	title: 'components/MkWindow',
	component: MkWindow,
};
export const Default = {
	components: {
		MkWindow,
	},
	template: '<MkWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
