import { Meta, StoryObj } from '@storybook/vue3';
import MkImageViewer from './MkImageViewer.vue';
const meta = {
	title: 'components/MkImageViewer',
	component: MkImageViewer,
} satisfies Meta<typeof MkImageViewer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkImageViewer,
			},
			props: Object.keys(argTypes),
			template: '<MkImageViewer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkImageViewer>;
export default meta;
