import { Meta, StoryObj } from '@storybook/vue3';
import deck_ from './deck.vue';
const meta = {
	title: 'pages/settings/deck',
	component: deck_,
} satisfies Meta<typeof deck_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				deck_,
			},
			props: Object.keys(argTypes),
			template: '<deck_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof deck_>;
export default meta;
