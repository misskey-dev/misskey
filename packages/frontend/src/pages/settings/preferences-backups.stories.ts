/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import preferences_backups from './preferences-backups.vue';
const meta = {
	title: 'pages/settings/preferences-backups',
	component: preferences_backups,
} satisfies Meta<typeof preferences_backups>;
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
} satisfies StoryObj<typeof preferences_backups>;
export default meta;
