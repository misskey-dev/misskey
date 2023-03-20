import { Meta, StoryObj } from '@storybook/vue3';
import MkAsUi from './MkAsUi.vue';
const meta = {
	title: 'components/MkAsUi',
	component: MkAsUi,
} satisfies Meta<typeof MkAsUi>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAsUi,
			},
			props: Object.keys(argTypes),
			template: '<MkAsUi v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkAsUi>;
export default meta;
