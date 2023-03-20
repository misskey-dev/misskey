import { Meta, Story } from '@storybook/vue3';
import MkRippleEffect from './MkRippleEffect.vue';
const meta = {
	title: 'components/MkRippleEffect',
	component: MkRippleEffect,
};
export const Default = {
	components: {
		MkRippleEffect,
	},
	template: '<MkRippleEffect />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
