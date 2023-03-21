/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import _2fa from './2fa.vue';
const meta = {
	title: 'pages/settings/2fa',
	component: _2fa,
} satisfies Meta<typeof _2fa>;
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
} satisfies StoryObj<typeof _2fa>;
export default meta;
