import { Meta, StoryObj } from '@storybook/vue3';
import MkNumber from './MkNumber.vue';
const meta = {
	title: 'components/MkNumber',
	component: MkNumber,
} satisfies Meta<typeof MkNumber>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNumber,
			},
			props: Object.keys(argTypes),
			template: '<MkNumber v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkNumber>;
export default meta;
