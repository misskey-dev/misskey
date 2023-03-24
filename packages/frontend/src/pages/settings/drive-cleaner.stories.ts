/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import drive_cleaner from './drive-cleaner.vue';
const meta = {
	title: 'pages/settings/drive-cleaner',
	component: drive_cleaner,
} satisfies Meta<typeof drive_cleaner>;
export const Default = {
	render(args) {
		return {
			components: {
				drive_cleaner,
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
			template: '<drive_cleaner v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof drive_cleaner>;
export default meta;
