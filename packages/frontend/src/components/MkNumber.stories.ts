import { Meta, Story } from '@storybook/vue3';
import MkNumber from './MkNumber.vue';
const meta = {
	title: 'components/MkNumber',
	component: MkNumber,
};
export const Default = {
	components: {
		MkNumber,
	},
	template: '<MkNumber />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
