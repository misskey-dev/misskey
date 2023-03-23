/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import drive_ from './drive.vue';
const meta = {
	title: 'pages/settings/drive',
	component: drive_,
} satisfies Meta<typeof drive_>;
export const Default = {
	render(args) {
		return {
			components: {
				drive_,
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
			template: '<drive_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof drive_>;
export default meta;
