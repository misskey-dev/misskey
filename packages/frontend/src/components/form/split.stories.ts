import { Meta, StoryObj } from '@storybook/vue3';
import split_ from './split.vue';
const meta = {
	title: 'components/form/split',
	component: split_,
} satisfies Meta<typeof split_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				split_,
			},
			props: Object.keys(argTypes),
			template: '<split_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof split_>;
export default meta;
