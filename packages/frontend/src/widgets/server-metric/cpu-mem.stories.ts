import { Meta, Story } from '@storybook/vue3';
import cpu_mem from './cpu-mem.vue';
const meta = {
	title: 'widgets/server-metric/cpu-mem',
	component: cpu_mem,
};
export const Default = {
	components: {
		cpu_mem,
	},
	template: '<cpu_mem />',
};
export default meta;
