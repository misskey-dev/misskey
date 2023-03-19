import { Meta, Story } from '@storybook/vue3';
import privacy from './privacy.vue';
const meta = {
	title: 'pages/settings/privacy',
	component: privacy,
};
export const Default = {
	components: {
		privacy,
	},
	template: '<privacy />',
};
export default meta;
