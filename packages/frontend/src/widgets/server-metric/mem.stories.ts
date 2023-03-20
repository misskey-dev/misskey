import { Meta, Story } from '@storybook/vue3';
import mem from './mem.vue';
const meta = {
	title: 'widgets/server-metric/mem',
	component: mem,
};
export const Default = {
	components: {
		mem,
	},
	template: '<mem />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
