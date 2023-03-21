/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkImgWithBlurhash from './MkImgWithBlurhash.vue';
const meta = {
	title: 'components/MkImgWithBlurhash',
	component: MkImgWithBlurhash,
} satisfies Meta<typeof MkImgWithBlurhash>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkImgWithBlurhash,
			},
			props: Object.keys(argTypes),
			template: '<MkImgWithBlurhash v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkImgWithBlurhash>;
export default meta;
