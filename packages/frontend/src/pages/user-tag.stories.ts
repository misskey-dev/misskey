import { Meta, Story } from '@storybook/vue3';
import user_tag from './user-tag.vue';
const meta = {
	title: 'pages/user-tag',
	component: user_tag,
};
export const Default = {
	components: {
		user_tag,
	},
	template: '<user_tag />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
