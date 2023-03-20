import { Meta, Story } from '@storybook/vue3';
import notification from './notification.vue';
const meta = {
	title: 'ui/_common_/notification',
	component: notification,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				notification,
			},
			props: Object.keys(argTypes),
			template: '<notification v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
