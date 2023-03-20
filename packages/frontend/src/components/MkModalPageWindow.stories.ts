import { Meta, Story } from '@storybook/vue3';
import MkModalPageWindow from './MkModalPageWindow.vue';
const meta = {
	title: 'components/MkModalPageWindow',
	component: MkModalPageWindow,
};
export const Default = {
	components: {
		MkModalPageWindow,
	},
	template: '<MkModalPageWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
