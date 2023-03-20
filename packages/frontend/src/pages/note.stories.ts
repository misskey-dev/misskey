import { Meta, StoryObj } from '@storybook/vue3';
import note from './note.vue';
const meta = {
	title: 'pages/note',
	component: note,
} satisfies Meta<typeof note>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				note,
			},
			props: Object.keys(argTypes),
			template: '<note v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof note>;
export default meta;
