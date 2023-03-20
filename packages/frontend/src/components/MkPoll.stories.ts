import { Meta, StoryObj } from '@storybook/vue3';
import MkPoll from './MkPoll.vue';
const meta = {
	title: 'components/MkPoll',
	component: MkPoll,
} satisfies Meta<typeof MkPoll>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPoll,
			},
			props: Object.keys(argTypes),
			template: '<MkPoll v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPoll>;
export default meta;
