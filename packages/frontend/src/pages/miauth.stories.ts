import { Meta, Story } from '@storybook/vue3';
import miauth from './miauth.vue';
const meta = {
	title: 'pages/miauth',
	component: miauth,
};
export const Default = {
	components: {
		miauth,
	},
	template: '<miauth />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
