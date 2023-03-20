import { Meta, Story } from '@storybook/vue3';
import proxy_account from './proxy-account.vue';
const meta = {
	title: 'pages/admin/proxy-account',
	component: proxy_account,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				proxy_account,
			},
			props: Object.keys(argTypes),
			template: '<proxy_account v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
