import { Meta, Story } from '@storybook/vue3';
import MkCode from './MkCode.vue';
const meta = {
	title: 'components/MkCode',
	component: MkCode,
};
export const Default = {
	components: {
		MkCode,
	},
	template: '<MkCode />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
