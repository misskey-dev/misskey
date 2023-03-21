/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import webhook_edit from './webhook.edit.vue';
const meta = {
	title: 'pages/settings/webhook.edit',
	component: webhook_edit,
} satisfies Meta<typeof webhook_edit>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				webhook_edit,
			},
			props: Object.keys(argTypes),
			template: '<webhook_edit v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof webhook_edit>;
export default meta;
