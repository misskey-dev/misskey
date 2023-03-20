import { Meta, Story } from '@storybook/vue3';
import MkInstanceCardMini from './MkInstanceCardMini.vue';
const meta = {
	title: 'components/MkInstanceCardMini',
	component: MkInstanceCardMini,
};
export const Default = {
	components: {
		MkInstanceCardMini,
	},
	template: '<MkInstanceCardMini />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
