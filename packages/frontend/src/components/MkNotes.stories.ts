import { Meta, Story } from '@storybook/vue3';
import MkNotes from './MkNotes.vue';
const meta = {
	title: 'components/MkNotes',
	component: MkNotes,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotes,
			},
			props: Object.keys(argTypes),
			template: '<MkNotes v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
