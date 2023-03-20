import { Meta, StoryObj } from '@storybook/vue3';
import notification from './notification.vue';
const meta = {
	title: 'ui/_common_/notification',
	component: notification,
} satisfies Meta<typeof notification>;
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
} satisfies StoryObj<typeof notification>;
export default meta;
