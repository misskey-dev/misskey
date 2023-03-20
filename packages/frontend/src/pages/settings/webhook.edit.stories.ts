import { Meta, Story } from '@storybook/vue3';
import webhook_edit from './webhook.edit.vue';
const meta = {
	title: 'pages/settings/webhook.edit',
	component: webhook_edit,
};
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
};
export default meta;
