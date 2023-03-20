import { Meta, StoryObj } from '@storybook/vue3';
import MkFlashPreview from './MkFlashPreview.vue';
const meta = {
	title: 'components/MkFlashPreview',
	component: MkFlashPreview,
} satisfies Meta<typeof MkFlashPreview>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFlashPreview,
			},
			props: Object.keys(argTypes),
			template: '<MkFlashPreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFlashPreview>;
export default meta;
