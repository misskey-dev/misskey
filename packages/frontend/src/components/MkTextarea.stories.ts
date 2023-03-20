import { Meta, Story } from '@storybook/vue3';
import MkTextarea from './MkTextarea.vue';
const meta = {
	title: 'components/MkTextarea',
	component: MkTextarea,
};
export const Default = {
	components: {
		MkTextarea,
	},
	template: '<MkTextarea />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
