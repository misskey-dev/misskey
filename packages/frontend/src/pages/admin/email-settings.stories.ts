import { Meta, StoryObj } from '@storybook/vue3';
import email_settings from './email-settings.vue';
const meta = {
	title: 'pages/admin/email-settings',
	component: email_settings,
} satisfies Meta<typeof email_settings>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				email_settings,
			},
			props: Object.keys(argTypes),
			template: '<email_settings v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof email_settings>;
export default meta;
