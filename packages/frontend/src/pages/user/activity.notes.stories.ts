import { Meta, Story } from '@storybook/vue3';
import activity_notes from './activity.notes.vue';
const meta = {
	title: 'pages/user/activity.notes',
	component: activity_notes,
};
export const Default = {
	components: {
		activity_notes,
	},
	template: '<activity.notes />',
};
export default meta;
