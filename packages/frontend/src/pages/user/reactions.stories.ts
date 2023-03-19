import { Meta, Story } from '@storybook/vue3';
import reactions from './reactions.vue';
const meta = {
	title: 'pages/user/reactions',
	component: reactions,
};
export const Default = {
	components: {
		reactions,
	},
	template: '<reactions />',
};
export default meta;
