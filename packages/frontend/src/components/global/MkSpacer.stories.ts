import { Meta, StoryObj } from '@storybook/vue3';
import MkSpacer from './MkSpacer.vue';
const meta = {
	title: 'components/global/MkSpacer',
	component: MkSpacer,
} satisfies Meta<typeof MkSpacer>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSpacer,
			},
			props: Object.keys(argTypes),
			template: '<MkSpacer v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkSpacer>;
export default meta;
