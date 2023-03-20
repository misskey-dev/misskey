import { Meta, Story } from '@storybook/vue3';
import achievements from './achievements.vue';
const meta = {
	title: 'pages/user/achievements',
	component: achievements,
};
export const Default = {
	components: {
		achievements,
	},
	template: '<achievements />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
