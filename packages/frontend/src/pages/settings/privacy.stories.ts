/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import privacy_ from './privacy.vue';
const meta = {
	title: 'pages/settings/privacy',
	component: privacy_,
} satisfies Meta<typeof privacy_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				privacy_,
			},
			props: Object.keys(argTypes),
			template: '<privacy_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof privacy_>;
export default meta;
