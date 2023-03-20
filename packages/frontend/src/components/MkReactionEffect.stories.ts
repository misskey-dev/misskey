import { Meta, StoryObj } from '@storybook/vue3';
import MkReactionEffect from './MkReactionEffect.vue';
const meta = {
	title: 'components/MkReactionEffect',
	component: MkReactionEffect,
} satisfies Meta<typeof MkReactionEffect>;
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
} satisfies StoryObj<typeof MkReactionEffect>;
export default meta;
