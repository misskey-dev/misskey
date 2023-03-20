import { Meta, Story } from '@storybook/vue3';
import MkPageWindow from './MkPageWindow.vue';
const meta = {
	title: 'components/MkPageWindow',
	component: MkPageWindow,
};
export const Default = {
	components: {
		MkPageWindow,
	},
	template: '<MkPageWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
