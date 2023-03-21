import { Meta, StoryObj } from '@storybook/vue3';
import kanban_ from './kanban.vue';
const meta = {
	title: 'ui/visitor/kanban',
	component: kanban_,
} satisfies Meta<typeof kanban_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				kanban_,
			},
			props: Object.keys(argTypes),
			template: '<kanban_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof kanban_>;
export default meta;
