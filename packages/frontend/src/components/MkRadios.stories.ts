import { Meta, Story } from '@storybook/vue3';
import MkRadios from './MkRadios.vue';
const meta = {
	title: 'components/MkRadios',
	component: MkRadios,
};
export const Default = {
	components: {
		MkRadios,
	},
	template: '<MkRadios />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
