import { Meta, StoryObj } from '@storybook/vue3';
import split from './split.vue';
const meta = {
	title: 'components/form/split',
	component: split,
} satisfies Meta<typeof split>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				split,
			},
			props: Object.keys(argTypes),
			template: '<split v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof split>;
export default meta;
