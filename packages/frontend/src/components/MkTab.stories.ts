import { Meta, Story } from '@storybook/vue3';
import MkTab from './MkTab.vue';
const meta = {
	title: 'components/MkTab',
	component: MkTab,
};
export const Default = {
	components: {
		MkTab,
	},
	template: '<MkTab />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
