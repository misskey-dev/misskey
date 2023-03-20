import { Meta, StoryObj } from '@storybook/vue3';
import deck from './deck.vue';
const meta = {
	title: 'ui/deck',
	component: deck,
} satisfies Meta<typeof deck>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				deck,
			},
			props: Object.keys(argTypes),
			template: '<deck v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof deck>;
export default meta;
