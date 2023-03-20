import { Meta, Story } from '@storybook/vue3';
import MkNotePreview from './MkNotePreview.vue';
const meta = {
	title: 'components/MkNotePreview',
	component: MkNotePreview,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNotePreview,
			},
			props: Object.keys(argTypes),
			template: '<MkNotePreview v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
