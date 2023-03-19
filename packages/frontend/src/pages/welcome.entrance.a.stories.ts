import { Meta, Story } from '@storybook/vue3';
import welcome_entrance_a from './welcome.entrance.a.vue';
const meta = {
	title: 'pages/welcome.entrance.a',
	component: welcome_entrance_a,
};
export const Default = {
	components: {
		welcome_entrance_a,
	},
	template: '<welcome_entrance_a />',
};
export default meta;
