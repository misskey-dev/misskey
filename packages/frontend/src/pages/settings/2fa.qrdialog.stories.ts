import { Meta, Story } from '@storybook/vue3';
import _2fa_qrdialog from './2fa.qrdialog.vue';
const meta = {
	title: 'pages/settings/2fa.qrdialog',
	component: _2fa_qrdialog,
};
export const Default = {
	components: {
		_2fa_qrdialog,
	},
	template: '<_2fa_qrdialog />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
