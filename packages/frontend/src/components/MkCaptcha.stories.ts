import { Meta, Story } from '@storybook/vue3';
import MkCaptcha from './MkCaptcha.vue';
const meta = {
	title: 'components/MkCaptcha',
	component: MkCaptcha,
};
export const Default = {
	components: {
		MkCaptcha,
	},
	template: '<MkCaptcha />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
