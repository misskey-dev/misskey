import { Meta, Story } from '@storybook/vue3';
import other from './other.vue';
const meta = {
	title: 'pages/settings/other',
	component: other,
};
export const Default = {
	components: {
		other,
	},
	template: '<other />',
};
export default meta;
