import { Meta, Story } from '@storybook/vue3';
import webhook from './webhook.vue';
const meta = {
	title: 'pages/settings/webhook',
	component: webhook,
};
export const Default = {
	components: {
		webhook,
	},
	template: '<webhook />',
};
export default meta;
