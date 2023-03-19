import { Meta, Story } from '@storybook/vue3';
import preferences_backups from './preferences-backups.vue';
const meta = {
	title: 'pages/settings/preferences-backups',
	component: preferences_backups,
};
export const Default = {
	components: {
		preferences_backups,
	},
	template: '<preferences_backups />',
};
export default meta;
