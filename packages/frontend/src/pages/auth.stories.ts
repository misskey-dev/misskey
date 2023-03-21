import { Meta, StoryObj } from '@storybook/vue3';
import auth_ from './auth.vue';
const meta = {
	title: 'pages/auth',
	component: auth_,
} satisfies Meta<typeof auth_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				auth_,
			},
			props: Object.keys(argTypes),
			template: '<auth_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof auth_>;
export default meta;
