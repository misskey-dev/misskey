/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkPostForm from './MkPostForm.vue';
const meta = {
	title: 'components/MkPostForm',
	component: MkPostForm,
} satisfies Meta<typeof MkPostForm>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPostForm,
			},
			props: Object.keys(argTypes),
			template: '<MkPostForm v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPostForm>;
export default meta;
