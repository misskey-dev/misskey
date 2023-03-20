import { Meta, Story } from '@storybook/vue3';
import webhook from './webhook.vue';
const meta = {
	title: 'pages/settings/webhook',
	component: webhook,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				webhook,
			},
			props: Object.keys(argTypes),
			template: '<webhook v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
