/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import webhook_new from './webhook.new.vue';
const meta = {
	title: 'pages/settings/webhook.new',
	component: webhook_new,
} satisfies Meta<typeof webhook_new>;
export const Default = {
	render(args) {
		return {
			components: {
				webhook_new,
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
			template: '<webhook_new v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof webhook_new>;
export default meta;
