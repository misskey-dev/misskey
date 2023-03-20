import { Meta, StoryObj } from '@storybook/vue3';
import MkError from './MkError.vue';
const meta = {
	title: 'components/global/MkError',
	component: MkError,
} satisfies Meta<typeof MkError>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkError,
			},
			props: Object.keys(argTypes),
			template: '<MkError v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkError>;
export default meta;
