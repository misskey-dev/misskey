/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import email_settings from './email-settings.vue';
const meta = {
	title: 'pages/admin/email-settings',
	component: email_settings,
} satisfies Meta<typeof email_settings>;
export const Default = {
	render(args) {
		return {
			components: {
				email_settings,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<email_settings v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof email_settings>;
export default meta;
