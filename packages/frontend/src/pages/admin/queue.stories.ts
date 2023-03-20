import { Meta, Story } from '@storybook/vue3';
import queue from './queue.vue';
const meta = {
	title: 'pages/admin/queue',
	component: queue,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				queue,
			},
			props: Object.keys(argTypes),
			template: '<queue v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
