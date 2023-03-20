import { Meta, Story } from '@storybook/vue3';
import _2fa_qrdialog from './2fa.qrdialog.vue';
const meta = {
	title: 'pages/settings/2fa.qrdialog',
	component: _2fa_qrdialog,
};
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
};
export default meta;
