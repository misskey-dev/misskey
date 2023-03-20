import { Meta, StoryObj } from '@storybook/vue3';
import proxy_account from './proxy-account.vue';
const meta = {
	title: 'pages/admin/proxy-account',
	component: proxy_account,
} satisfies Meta<typeof proxy_account>;
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
} satisfies StoryObj<typeof proxy_account>;
export default meta;
