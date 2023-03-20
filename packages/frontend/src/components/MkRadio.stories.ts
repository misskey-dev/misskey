import { Meta, Story } from '@storybook/vue3';
import MkRadio from './MkRadio.vue';
const meta = {
	title: 'components/MkRadio',
	component: MkRadio,
};
export const Default = {
	components: {
		MkRadio,
	},
	template: '<MkRadio />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
