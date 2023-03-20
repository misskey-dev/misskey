import { Meta, Story } from '@storybook/vue3';
import _error_ from './_error_.vue';
const meta = {
	title: 'pages/_error_',
	component: _error_,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				_error_,
			},
			props: Object.keys(argTypes),
			template: '<_error_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
