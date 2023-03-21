import { Meta, StoryObj } from '@storybook/vue3';
import reaction_ from './reaction.vue';
const meta = {
	title: 'pages/settings/reaction',
	component: reaction_,
} satisfies Meta<typeof reaction_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				reaction_,
			},
			props: Object.keys(argTypes),
			template: '<reaction_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof reaction_>;
export default meta;
