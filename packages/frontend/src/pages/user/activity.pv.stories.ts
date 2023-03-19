import { Meta, Story } from '@storybook/vue3';
import activity_pv from './activity.pv.vue';
const meta = {
	title: 'pages/user/activity.pv',
	component: activity_pv,
};
export const Default = {
	components: {
		activity_pv,
	},
	template: '<activity.pv />',
};
export default meta;
