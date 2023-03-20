import { Meta, Story } from '@storybook/vue3';
import MkInstanceStats from './MkInstanceStats.vue';
const meta = {
	title: 'components/MkInstanceStats',
	component: MkInstanceStats,
};
export const Default = {
	components: {
		MkInstanceStats,
	},
	template: '<MkInstanceStats />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
