import { Meta, StoryObj } from '@storybook/vue3';
import MkCropperDialog from './MkCropperDialog.vue';
const meta = {
	title: 'components/MkCropperDialog',
	component: MkCropperDialog,
} satisfies Meta<typeof MkCropperDialog>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkCropperDialog,
			},
			props: Object.keys(argTypes),
			template: '<MkCropperDialog v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkCropperDialog>;
export default meta;
