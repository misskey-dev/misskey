import { Meta, StoryObj } from '@storybook/vue3';
import classic from './classic.vue';
const meta = {
	title: 'ui/classic',
	component: classic,
} satisfies Meta<typeof classic>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				classic,
			},
			props: Object.keys(argTypes),
			template: '<classic v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof classic>;
export default meta;
