import { Meta, Story } from '@storybook/vue3';
import _loading_ from './_loading_.vue';
const meta = {
	title: 'pages/_loading_',
	component: _loading_,
};
export const Default = {
	components: {
		_loading_,
	},
	template: '<_loading_ />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
