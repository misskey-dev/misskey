import { Meta, Story } from '@storybook/vue3';
import webhook_edit from './webhook.edit.vue';
const meta = {
	title: 'pages/settings/webhook.edit',
	component: webhook_edit,
};
export const Default = {
	components: {
		webhook_edit,
	},
	template: '<webhook_edit />',
};
export default meta;
