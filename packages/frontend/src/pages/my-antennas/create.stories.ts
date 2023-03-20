import { Meta, Story } from '@storybook/vue3';
import create from './create.vue';
const meta = {
	title: 'pages/my-antennas/create',
	component: create,
};
export const Default = {
	components: {
		create,
	},
	template: '<create />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
