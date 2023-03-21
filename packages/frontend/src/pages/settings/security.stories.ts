/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import security_ from './security.vue';
const meta = {
	title: 'pages/settings/security',
	component: security_,
} satisfies Meta<typeof security_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				security_,
			},
			props: Object.keys(argTypes),
			template: '<security_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof security_>;
export default meta;
