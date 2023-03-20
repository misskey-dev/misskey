import { Meta, Story } from '@storybook/vue3';
import preferences_backups from './preferences-backups.vue';
const meta = {
	title: 'pages/settings/preferences-backups',
	component: preferences_backups,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				preferences_backups,
			},
			props: Object.keys(argTypes),
			template: '<preferences_backups v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
