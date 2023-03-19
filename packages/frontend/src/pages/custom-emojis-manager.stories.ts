import { Meta, Story } from '@storybook/vue3';
import custom_emojis_manager from './custom-emojis-manager.vue';
const meta = {
	title: 'pages/custom-emojis-manager',
	component: custom_emojis_manager,
};
export const Default = {
	components: {
		custom_emojis_manager,
	},
	template: '<custom-emojis-manager />',
};
export default meta;
