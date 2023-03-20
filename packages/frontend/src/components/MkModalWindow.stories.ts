import { Meta, Story } from '@storybook/vue3';
import MkModalWindow from './MkModalWindow.vue';
const meta = {
	title: 'components/MkModalWindow',
	component: MkModalWindow,
};
export const Default = {
	components: {
		MkModalWindow,
	},
	template: '<MkModalWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
