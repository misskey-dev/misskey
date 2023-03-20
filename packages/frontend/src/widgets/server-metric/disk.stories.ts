import { Meta, Story } from '@storybook/vue3';
import disk from './disk.vue';
const meta = {
	title: 'widgets/server-metric/disk',
	component: disk,
};
export const Default = {
	components: {
		disk,
	},
	template: '<disk />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
