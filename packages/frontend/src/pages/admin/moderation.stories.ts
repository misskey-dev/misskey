import { Meta, Story } from '@storybook/vue3';
import moderation from './moderation.vue';
const meta = {
	title: 'pages/admin/moderation',
	component: moderation,
};
export const Default = {
	components: {
		moderation,
	},
	template: '<moderation />',
};
export default meta;
