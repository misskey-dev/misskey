import { Meta, Story } from '@storybook/vue3';
import MkNoteHeader from './MkNoteHeader.vue';
const meta = {
	title: 'components/MkNoteHeader',
	component: MkNoteHeader,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNoteHeader,
			},
			props: Object.keys(argTypes),
			template: '<MkNoteHeader v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
