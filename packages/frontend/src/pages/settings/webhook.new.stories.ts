import { Meta, Story } from '@storybook/vue3';
import webhook_new from './webhook.new.vue';
const meta = {
	title: 'pages/settings/webhook.new',
	component: webhook_new,
};
export const Default = {
	components: {
		webhook_new,
	},
	template: '<webhook_new />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
