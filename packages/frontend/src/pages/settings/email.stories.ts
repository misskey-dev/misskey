/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import email_ from './email.vue';
const meta = {
	title: 'pages/settings/email',
	component: email_,
} satisfies Meta<typeof email_>;
export const Default = {
	render(args) {
		return {
			components: {
				email_,
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
			template: '<email_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof email_>;
export default meta;
