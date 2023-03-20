import { Meta, StoryObj } from '@storybook/vue3';
import MkUserCardMini from './MkUserCardMini.vue';
const meta = {
	title: 'components/MkUserCardMini',
	component: MkUserCardMini,
} satisfies Meta<typeof MkUserCardMini>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUserCardMini,
			},
			props: Object.keys(argTypes),
			template: '<MkUserCardMini v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUserCardMini>;
export default meta;
