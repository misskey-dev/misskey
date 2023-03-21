/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkInstanceCardMini from './MkInstanceCardMini.vue';
const meta = {
	title: 'components/MkInstanceCardMini',
	component: MkInstanceCardMini,
} satisfies Meta<typeof MkInstanceCardMini>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkInstanceCardMini,
			},
			props: Object.keys(argTypes),
			template: '<MkInstanceCardMini v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkInstanceCardMini>;
export default meta;
