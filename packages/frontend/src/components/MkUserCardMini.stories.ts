import { Meta, Story } from '@storybook/vue3';
import MkUserCardMini from './MkUserCardMini.vue';
const meta = {
	title: 'components/MkUserCardMini',
	component: MkUserCardMini,
};
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
};
export default meta;
