/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import settings_ from './settings.vue';
const meta = {
	title: 'pages/admin/settings',
	component: settings_,
} satisfies Meta<typeof settings_>;
export const Default = {
	render(args) {
		return {
			components: {
				settings_,
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
			template: '<settings_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof settings_>;
export default meta;
