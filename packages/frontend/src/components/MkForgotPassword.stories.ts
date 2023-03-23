/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkForgotPassword from './MkForgotPassword.vue';
const meta = {
	title: 'components/MkForgotPassword',
	component: MkForgotPassword,
} satisfies Meta<typeof MkForgotPassword>;
export const Default = {
	render(args) {
		return {
			components: {
				MkForgotPassword,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<MkForgotPassword v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkForgotPassword>;
export default meta;
