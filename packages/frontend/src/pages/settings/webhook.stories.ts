import { Meta, StoryObj } from '@storybook/vue3';
import webhook from './webhook.vue';
const meta = {
	title: 'pages/settings/webhook',
	component: webhook,
} satisfies Meta<typeof webhook>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				webhook,
			},
			props: Object.keys(argTypes),
			template: '<webhook v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof webhook>;
export default meta;
