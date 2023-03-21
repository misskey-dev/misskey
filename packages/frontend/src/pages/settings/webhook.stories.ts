import { Meta, StoryObj } from '@storybook/vue3';
import webhook_ from './webhook.vue';
const meta = {
	title: 'pages/settings/webhook',
	component: webhook_,
} satisfies Meta<typeof webhook_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				webhook_,
			},
			props: Object.keys(argTypes),
			template: '<webhook_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof webhook_>;
export default meta;
