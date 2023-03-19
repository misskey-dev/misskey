import { Meta, Story } from '@storybook/vue3';
import proxy_account from './proxy-account.vue';
const meta = {
	title: 'pages/admin/proxy-account',
	component: proxy_account,
};
export const Default = {
	components: {
		proxy_account,
	},
	template: '<proxy-account />',
};
export default meta;
