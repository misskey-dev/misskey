import { Meta, Story } from '@storybook/vue3';
import accounts from './accounts.vue';
const meta = {
	title: 'pages/settings/accounts',
	component: accounts,
};
export const Default = {
	components: {
		accounts,
	},
	template: '<accounts />',
};
export default meta;
