import { Meta, StoryObj } from '@storybook/vue3';
import MkInfo from './MkInfo.vue';
const meta = {
	title: 'components/MkInfo',
	component: MkInfo,
} satisfies Meta<typeof MkInfo>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInfo,
			},
			props: Object.keys(argTypes),
			template: '<MkInfo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInfo>;
export default meta;
