/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import share_ from './share.vue';
const meta = {
	title: 'pages/share',
	component: share_,
} satisfies Meta<typeof share_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				share_,
			},
			props: Object.keys(argTypes),
			template: '<share_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof share_>;
export default meta;
