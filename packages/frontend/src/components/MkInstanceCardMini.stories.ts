import { Meta, Story } from '@storybook/vue3';
import MkInstanceCardMini from './MkInstanceCardMini.vue';
const meta = {
	title: 'components/MkInstanceCardMini',
	component: MkInstanceCardMini,
};
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
};
export default meta;
