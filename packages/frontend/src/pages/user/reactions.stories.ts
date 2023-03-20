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
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
