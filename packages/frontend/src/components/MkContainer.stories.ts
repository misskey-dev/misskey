import { Meta, StoryObj } from '@storybook/vue3';
import MkContainer from './MkContainer.vue';
const meta = {
	title: 'components/MkContainer',
	component: MkContainer,
} satisfies Meta<typeof MkContainer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkContainer,
			},
			props: Object.keys(argTypes),
			template: '<MkContainer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkContainer>;
export default meta;
