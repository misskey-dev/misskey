import { Meta, Story } from '@storybook/vue3';
import queue from './queue.vue';
const meta = {
	title: 'pages/admin/queue',
	component: queue,
};
export const Default = {
	components: {
		queue,
	},
	template: '<queue />',
};
export default meta;
