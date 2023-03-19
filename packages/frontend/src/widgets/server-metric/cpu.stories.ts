import { Meta, Story } from '@storybook/vue3';
import cpu from './cpu.vue';
const meta = {
	title: 'widgets/server-metric/cpu',
	component: cpu,
};
export const Default = {
	components: {
		cpu,
	},
	template: '<cpu />',
};
export default meta;
