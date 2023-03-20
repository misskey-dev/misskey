import { Meta, StoryObj } from '@storybook/vue3';
import reaction from './reaction.vue';
const meta = {
	title: 'pages/settings/reaction',
	component: reaction,
} satisfies Meta<typeof reaction>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reaction,
			},
			props: Object.keys(argTypes),
			template: '<reaction v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof reaction>;
export default meta;
