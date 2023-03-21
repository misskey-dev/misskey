/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import auth_form from './auth.form.vue';
const meta = {
	title: 'pages/auth.form',
	component: auth_form,
} satisfies Meta<typeof auth_form>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				auth_form,
			},
			props: Object.keys(argTypes),
			template: '<auth_form v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof auth_form>;
export default meta;
