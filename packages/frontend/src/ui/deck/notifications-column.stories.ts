import { Meta, Story } from '@storybook/vue3';
import notifications_column from './notifications-column.vue';
const meta = {
	title: 'ui/deck/notifications-column',
	component: notifications_column,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				notifications_column,
			},
			props: Object.keys(argTypes),
			template: '<notifications_column v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
