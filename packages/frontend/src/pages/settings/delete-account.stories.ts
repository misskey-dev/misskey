import { Meta, Story } from '@storybook/vue3';
import delete_account from './delete-account.vue';
const meta = {
	title: 'pages/settings/delete-account',
	component: delete_account,
};
export const Default = {
	components: {
		delete_account,
	},
	template: '<delete_account />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
