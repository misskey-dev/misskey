import { Meta, StoryObj } from '@storybook/vue3';
import about_emojis from './about.emojis.vue';
const meta = {
	title: 'pages/about.emojis',
	component: about_emojis,
} satisfies Meta<typeof about_emojis>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				about_emojis,
			},
			props: Object.keys(argTypes),
			template: '<about_emojis v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof about_emojis>;
export default meta;
