/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import reactions_ from './reactions.vue';
const meta = {
	title: 'pages/user/reactions',
	component: reactions_,
} satisfies Meta<typeof reactions_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reactions_,
			},
			props: Object.keys(argTypes),
			template: '<reactions_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof reactions_>;
export default meta;
