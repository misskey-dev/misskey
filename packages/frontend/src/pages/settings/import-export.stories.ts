import { Meta, Story } from '@storybook/vue3';
import import_export from './import-export.vue';
const meta = {
	title: 'pages/settings/import-export',
	component: import_export,
};
export const Default = {
	components: {
		import_export,
	},
	template: '<import-export />',
};
export default meta;
