import { Meta, Story } from '@storybook/vue3';
import follow from './follow.vue';
const meta = {
	title: 'pages/follow',
	component: follow,
};
export const Default = {
	components: {
		follow,
	},
	template: '<follow />',
};
export default meta;
