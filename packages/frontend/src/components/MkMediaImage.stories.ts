import { Meta, StoryObj } from '@storybook/vue3';
import MkMediaImage from './MkMediaImage.vue';
const meta = {
	title: 'components/MkMediaImage',
	component: MkMediaImage,
} satisfies Meta<typeof MkMediaImage>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkMediaImage,
			},
			props: Object.keys(argTypes),
			template: '<MkMediaImage v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMediaImage>;
export default meta;
