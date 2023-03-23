/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import object_storage from './object-storage.vue';
const meta = {
	title: 'pages/admin/object-storage',
	component: object_storage,
} satisfies Meta<typeof object_storage>;
export const Default = {
	render(args) {
		return {
			components: {
				object_storage,
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
			template: '<object_storage v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof object_storage>;
export default meta;
