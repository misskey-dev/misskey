/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import database_ from './database.vue';
const meta = {
	title: 'pages/admin/database',
	component: database_,
} satisfies Meta<typeof database_>;
export const Default = {
	render(args) {
		return {
			components: {
				database_,
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
			template: '<database_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof database_>;
export default meta;
