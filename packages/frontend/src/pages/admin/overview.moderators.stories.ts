import { Meta, Story } from '@storybook/vue3';
import overview_moderators from './overview.moderators.vue';
const meta = {
	title: 'pages/admin/overview.moderators',
	component: overview_moderators,
};
export const Default = {
	components: {
		overview_moderators,
	},
	template: '<overview_moderators />',
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
