import { Meta, Story } from '@storybook/vue3';
import overview_queue from './overview.queue.vue';
const meta = {
	title: 'pages/admin/overview.queue',
	component: overview_queue,
};
export const Default = {
	components: {
		overview_queue,
	},
	template: '<overview_queue />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
