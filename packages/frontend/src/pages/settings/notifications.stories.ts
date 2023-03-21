import { Meta, StoryObj } from '@storybook/vue3';
import notifications_ from './notifications.vue';
const meta = {
	title: 'pages/settings/notifications',
	component: notifications_,
} satisfies Meta<typeof notifications_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				notifications_,
			},
			props: Object.keys(argTypes),
			template: '<notifications_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof notifications_>;
export default meta;
