/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkUrlPreviewPopup from './MkUrlPreviewPopup.vue';
const meta = {
	title: 'components/MkUrlPreviewPopup',
	component: MkUrlPreviewPopup,
} satisfies Meta<typeof MkUrlPreviewPopup>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkUrlPreviewPopup,
			},
			props: Object.keys(argTypes),
			template: '<MkUrlPreviewPopup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkUrlPreviewPopup>;
export default meta;
