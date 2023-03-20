import { Meta, StoryObj } from '@storybook/vue3';
import slot from './slot.vue';
const meta = {
	title: 'components/form/slot',
	component: slot,
} satisfies Meta<typeof slot>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				slot,
			},
			props: Object.keys(argTypes),
			template: '<slot v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof slot>;
export default meta;
