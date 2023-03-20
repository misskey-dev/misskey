import { Meta, Story } from '@storybook/vue3';
import account_info from './account-info.vue';
const meta = {
	title: 'pages/settings/account-info',
	component: account_info,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				account_info,
			},
			props: Object.keys(argTypes),
			template: '<account_info v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
