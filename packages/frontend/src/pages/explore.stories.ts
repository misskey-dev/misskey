import { Meta, Story } from '@storybook/vue3';
import explore from './explore.vue';
const meta = {
	title: 'pages/explore',
	component: explore,
};
export const Default = {
	components: {
		explore,
	},
	template: '<explore />',
};
export default meta;
