import { Meta, StoryObj } from '@storybook/vue3';
import MkTagCloud from './MkTagCloud.vue';
const meta = {
	title: 'components/MkTagCloud',
	component: MkTagCloud,
} satisfies Meta<typeof MkTagCloud>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkTagCloud,
			},
			props: Object.keys(argTypes),
			template: '<MkTagCloud v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkTagCloud>;
export default meta;
