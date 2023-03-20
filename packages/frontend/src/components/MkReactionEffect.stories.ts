import { Meta, Story } from '@storybook/vue3';
import MkReactionEffect from './MkReactionEffect.vue';
const meta = {
	title: 'components/MkReactionEffect',
	component: MkReactionEffect,
};
export const Default = {
	components: {
		MkReactionEffect,
	},
	template: '<MkReactionEffect />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
