import { Meta, Story } from '@storybook/vue3';
import _2fa from './2fa.vue';
const meta = {
	title: 'pages/settings/2fa',
	component: _2fa,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				_2fa,
			},
			props: Object.keys(argTypes),
			template: '<_2fa v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
