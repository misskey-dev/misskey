import { Meta, StoryObj } from '@storybook/vue3';
import _loading_ from './_loading_.vue';
const meta = {
	title: 'pages/_loading_',
	component: _loading_,
} satisfies Meta<typeof _loading_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				_loading_,
			},
			props: Object.keys(argTypes),
			template: '<_loading_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof _loading_>;
export default meta;
