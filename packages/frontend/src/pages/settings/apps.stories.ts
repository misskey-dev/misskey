/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import apps_ from './apps.vue';
const meta = {
	title: 'pages/settings/apps',
	component: apps_,
} satisfies Meta<typeof apps_>;
export const Default = {
	render(args) {
		return {
			components: {
				apps_,
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
			template: '<apps_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof apps_>;
export default meta;
