import { Meta, StoryObj } from '@storybook/vue3';
import queue_ from './queue.vue';
const meta = {
	title: 'pages/admin/queue',
	component: queue_,
} satisfies Meta<typeof queue_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				queue_,
			},
			props: Object.keys(argTypes),
			template: '<queue_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof queue_>;
export default meta;
