import { Meta, Story } from '@storybook/vue3';
import MkReactionEffect from './MkReactionEffect.vue';
const meta = {
	title: 'components/MkReactionEffect',
	component: MkReactionEffect,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkReactionEffect,
			},
			props: Object.keys(argTypes),
			template: '<MkReactionEffect v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
