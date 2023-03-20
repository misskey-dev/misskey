import { Meta, StoryObj } from '@storybook/vue3';
import MkCheckbox from './MkCheckbox.vue';
const meta = {
	title: 'components/MkCheckbox',
	component: MkCheckbox,
} satisfies Meta<typeof MkCheckbox>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCheckbox,
			},
			props: Object.keys(argTypes),
			template: '<MkCheckbox v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCheckbox>;
export default meta;
