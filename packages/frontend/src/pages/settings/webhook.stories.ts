/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import webhook_ from './webhook.vue';
const meta = {
	title: 'pages/settings/webhook',
	component: webhook_,
} satisfies Meta<typeof webhook_>;
export const Default = {
	render(args) {
		return {
			components: {
				webhook_,
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
			template: '<webhook_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof webhook_>;
export default meta;
