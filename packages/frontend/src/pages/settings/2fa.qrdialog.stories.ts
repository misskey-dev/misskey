/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import _2fa_qrdialog from './2fa.qrdialog.vue';
const meta = {
	title: 'pages/settings/2fa.qrdialog',
	component: _2fa_qrdialog,
} satisfies Meta<typeof _2fa_qrdialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				_2fa_qrdialog,
			},
			props: Object.keys(argTypes),
			template: '<_2fa_qrdialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof _2fa_qrdialog>;
export default meta;
