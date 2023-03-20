import { Meta, Story } from '@storybook/vue3';
import MkPlusOneEffect from './MkPlusOneEffect.vue';
const meta = {
	title: 'components/MkPlusOneEffect',
	component: MkPlusOneEffect,
};
export const Default = {
	components: {
		MkPlusOneEffect,
	},
	template: '<MkPlusOneEffect />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
