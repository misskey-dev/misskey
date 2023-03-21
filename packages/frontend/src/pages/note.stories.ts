import { Meta, StoryObj } from '@storybook/vue3';
import note_ from './note.vue';
const meta = {
	title: 'pages/note',
	component: note_,
} satisfies Meta<typeof note_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				note_,
			},
			props: Object.keys(argTypes),
			template: '<note_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof note_>;
export default meta;
