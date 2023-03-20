import { Meta, StoryObj } from '@storybook/vue3';
import a from './a.vue';
const meta = {
	title: 'ui/visitor/a',
	component: a,
} satisfies Meta<typeof a>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				a,
			},
			props: Object.keys(argTypes),
			template: '<a v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof a>;
export default meta;
