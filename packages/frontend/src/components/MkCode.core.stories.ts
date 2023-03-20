import { Meta, Story } from '@storybook/vue3';
import MkCode_core from './MkCode.core.vue';
const meta = {
	title: 'components/MkCode.core',
	component: MkCode_core,
};
export const Default = {
	components: {
		MkCode_core,
	},
	template: '<MkCode_core />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
