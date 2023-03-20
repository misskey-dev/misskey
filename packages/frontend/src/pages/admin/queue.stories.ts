import { Meta, StoryObj } from '@storybook/vue3';
import queue from './queue.vue';
const meta = {
	title: 'pages/admin/queue',
	component: queue,
} satisfies Meta<typeof queue>;
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
} satisfies StoryObj<typeof queue>;
export default meta;
