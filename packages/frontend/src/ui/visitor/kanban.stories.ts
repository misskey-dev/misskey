import { Meta, Story } from '@storybook/vue3';
import kanban from './kanban.vue';
const meta = {
	title: 'ui/visitor/kanban',
	component: kanban,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				kanban,
			},
			props: Object.keys(argTypes),
			template: '<kanban v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
