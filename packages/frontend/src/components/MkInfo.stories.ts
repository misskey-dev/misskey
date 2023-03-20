import { Meta, Story } from '@storybook/vue3';
import MkInfo from './MkInfo.vue';
const meta = {
	title: 'components/MkInfo',
	component: MkInfo,
};
export const Default = {
	components: {
		MkInfo,
	},
	template: '<MkInfo />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
