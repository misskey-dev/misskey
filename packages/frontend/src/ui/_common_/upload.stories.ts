/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import upload_ from './upload.vue';
const meta = {
	title: 'ui/_common_/upload',
	component: upload_,
} satisfies Meta<typeof upload_>;
export const Default = {
	render(args) {
		return {
			components: {
				upload_,
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
			template: '<upload_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof upload_>;
export default meta;
