import { Meta, StoryObj } from '@storybook/vue3';
import MkUserInfo from './MkUserInfo.vue';
const meta = {
	title: 'components/MkUserInfo',
	component: MkUserInfo,
} satisfies Meta<typeof MkUserInfo>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserInfo,
			},
			props: Object.keys(argTypes),
			template: '<MkUserInfo v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserInfo>;
export default meta;
