import { Meta, Story } from '@storybook/vue3';
import _2fa from './2fa.vue';
const meta = {
	title: 'pages/settings/2fa',
	component: _2fa,
};
export const Default = {
	components: {
		_2fa,
	},
	template: '<_2fa />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
