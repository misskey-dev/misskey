import { Meta, Story } from '@storybook/vue3';
import MkUserCardMini from './MkUserCardMini.vue';
const meta = {
	title: 'components/MkUserCardMini',
	component: MkUserCardMini,
};
export const Default = {
	components: {
		MkUserCardMini,
	},
	template: '<MkUserCardMini />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
