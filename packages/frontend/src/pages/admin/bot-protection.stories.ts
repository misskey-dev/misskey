/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import bot_protection from './bot-protection.vue';
const meta = {
	title: 'pages/admin/bot-protection',
	component: bot_protection,
} satisfies Meta<typeof bot_protection>;
export const Default = {
	render(args) {
		return {
			components: {
				bot_protection,
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
			template: '<bot_protection v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof bot_protection>;
export default meta;
