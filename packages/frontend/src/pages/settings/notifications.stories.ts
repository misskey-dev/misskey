import { Meta, Story } from '@storybook/vue3';
import notifications from './notifications.vue';
const meta = {
	title: 'pages/settings/notifications',
	component: notifications,
};
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
};
export default meta;
