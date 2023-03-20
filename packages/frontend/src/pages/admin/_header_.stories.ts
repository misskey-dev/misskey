import { Meta, Story } from '@storybook/vue3';
import _header_ from './_header_.vue';
const meta = {
	title: 'pages/admin/_header_',
	component: _header_,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				_header_,
			},
			props: Object.keys(argTypes),
			template: '<_header_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
