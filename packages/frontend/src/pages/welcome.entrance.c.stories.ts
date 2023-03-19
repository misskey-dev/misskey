import { Meta, Story } from '@storybook/vue3';
import welcome_entrance_c from './welcome.entrance.c.vue';
const meta = {
	title: 'pages/welcome.entrance.c',
	component: welcome_entrance_c,
};
export const Default = {
	components: {
		welcome_entrance_c,
	},
	template: '<welcome.entrance.c />',
};
export default meta;
