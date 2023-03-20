import { Meta, StoryObj } from '@storybook/vue3';
import notifications from './notifications.vue';
const meta = {
	title: 'pages/settings/notifications',
	component: notifications,
} satisfies Meta<typeof notifications>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				notifications,
			},
			props: Object.keys(argTypes),
			template: '<notifications v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof notifications>;
export default meta;
