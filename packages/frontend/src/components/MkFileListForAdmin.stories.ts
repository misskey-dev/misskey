/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFileListForAdmin from './MkFileListForAdmin.vue';
const meta = {
	title: 'components/MkFileListForAdmin',
	component: MkFileListForAdmin,
} satisfies Meta<typeof MkFileListForAdmin>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFileListForAdmin,
			},
			props: Object.keys(argTypes),
			template: '<MkFileListForAdmin v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFileListForAdmin>;
export default meta;
