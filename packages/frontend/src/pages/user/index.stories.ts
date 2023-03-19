import { Meta, Story } from '@storybook/vue3';
import index from './index.vue';
const meta = {
	title: 'pages/user/index',
	component: index,
};
export const Default = {
	components: {
		index,
	},
	template: '<index />',
};
export default meta;
