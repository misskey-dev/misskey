import { Meta, StoryObj } from '@storybook/vue3';
import MkUserSelectDialog from './MkUserSelectDialog.vue';
const meta = {
	title: 'components/MkUserSelectDialog',
	component: MkUserSelectDialog,
} satisfies Meta<typeof MkUserSelectDialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserSelectDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkUserSelectDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserSelectDialog>;
export default meta;
