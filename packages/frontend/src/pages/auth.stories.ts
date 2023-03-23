/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import auth_ from './auth.vue';
const meta = {
	title: 'pages/auth',
	component: auth_,
} satisfies Meta<typeof auth_>;
export const Default = {
	render(args) {
		return {
			components: {
				auth_,
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
			template: '<auth_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof auth_>;
export default meta;
