import { Meta, Story } from '@storybook/vue3';
import MkLoading from './MkLoading.vue';
const meta = {
	title: 'components/global/MkLoading',
	component: MkLoading,
};
export const Default = {
	components: {
		MkLoading,
	},
	template: '<MkLoading />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
