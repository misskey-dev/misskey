import { Meta, StoryObj } from '@storybook/vue3';
import MkStickyContainer from './MkStickyContainer.vue';
const meta = {
	title: 'components/global/MkStickyContainer',
	component: MkStickyContainer,
} satisfies Meta<typeof MkStickyContainer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkStickyContainer,
			},
			props: Object.keys(argTypes),
			template: '<MkStickyContainer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkStickyContainer>;
export default meta;
