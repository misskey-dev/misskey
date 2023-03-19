import { Meta, Story } from '@storybook/vue3';
import bot_protection from './bot-protection.vue';
const meta = {
	title: 'pages/admin/bot-protection',
	component: bot_protection,
};
export const Default = {
	components: {
		bot_protection,
	},
	template: '<bot_protection />',
};
export default meta;
