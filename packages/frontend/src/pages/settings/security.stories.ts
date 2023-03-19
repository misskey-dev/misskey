import { Meta, Story } from '@storybook/vue3';
import security from './security.vue';
const meta = {
	title: 'pages/settings/security',
	component: security,
};
export const Default = {
	components: {
		security,
	},
	template: '<security />',
};
export default meta;
