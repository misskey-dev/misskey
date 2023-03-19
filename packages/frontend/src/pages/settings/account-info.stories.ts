import { Meta, Story } from '@storybook/vue3';
import account_info from './account-info.vue';
const meta = {
	title: 'pages/settings/account-info',
	component: account_info,
};
export const Default = {
	components: {
		account_info,
	},
	template: '<account_info />',
};
export default meta;
