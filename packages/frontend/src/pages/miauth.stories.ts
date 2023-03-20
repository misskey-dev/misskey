import { Meta, StoryObj } from '@storybook/vue3';
import miauth from './miauth.vue';
const meta = {
	title: 'pages/miauth',
	component: miauth,
} satisfies Meta<typeof miauth>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				miauth,
			},
			props: Object.keys(argTypes),
			template: '<miauth v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof miauth>;
export default meta;
