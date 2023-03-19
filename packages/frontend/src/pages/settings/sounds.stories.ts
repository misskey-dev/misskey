import { Meta, Story } from '@storybook/vue3';
import sounds from './sounds.vue';
const meta = {
	title: 'pages/settings/sounds',
	component: sounds,
};
export const Default = {
	components: {
		sounds,
	},
	template: '<sounds />',
};
export default meta;
