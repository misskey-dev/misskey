/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import upload_ from './upload.vue';
const meta = {
	title: 'ui/_common_/upload',
	component: upload_,
} satisfies Meta<typeof upload_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				upload_,
			},
			props: Object.keys(argTypes),
			template: '<upload_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof upload_>;
export default meta;
