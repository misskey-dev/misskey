import { Meta, StoryObj } from '@storybook/vue3';
import MkPostFormAttaches from './MkPostFormAttaches.vue';
const meta = {
	title: 'components/MkPostFormAttaches',
	component: MkPostFormAttaches,
} satisfies Meta<typeof MkPostFormAttaches>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPostFormAttaches,
			},
			props: Object.keys(argTypes),
			template: '<MkPostFormAttaches v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPostFormAttaches>;
export default meta;
