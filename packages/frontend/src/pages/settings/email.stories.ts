import { Meta, StoryObj } from '@storybook/vue3';
import email_ from './email.vue';
const meta = {
	title: 'pages/settings/email',
	component: email_,
} satisfies Meta<typeof email_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				email_,
			},
			props: Object.keys(argTypes),
			template: '<email_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof email_>;
export default meta;
