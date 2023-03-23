/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import announcements_ from './announcements.vue';
const meta = {
	title: 'pages/admin/announcements',
	component: announcements_,
} satisfies Meta<typeof announcements_>;
export const Default = {
	render(args) {
		return {
			components: {
				announcements_,
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
			template: '<announcements_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof announcements_>;
export default meta;
