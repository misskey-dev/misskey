import { Meta, Story } from '@storybook/vue3';
import profile from './profile.vue';
const meta = {
	title: 'pages/settings/profile',
	component: profile,
};
export const Default = {
	components: {
		profile,
	},
	template: '<profile />',
};
export default meta;
