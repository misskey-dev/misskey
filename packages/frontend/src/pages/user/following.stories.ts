import { Meta, Story } from '@storybook/vue3';
import following from './following.vue';
const meta = {
	title: 'pages/user/following',
	component: following,
};
export const Default = {
	components: {
		following,
	},
	template: '<following />',
};
export default meta;
