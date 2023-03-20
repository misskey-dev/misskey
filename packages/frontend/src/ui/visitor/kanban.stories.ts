import { Meta, Story } from '@storybook/vue3';
import kanban from './kanban.vue';
const meta = {
	title: 'ui/visitor/kanban',
	component: kanban,
};
export const Default = {
	components: {
		kanban,
	},
	template: '<kanban />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
