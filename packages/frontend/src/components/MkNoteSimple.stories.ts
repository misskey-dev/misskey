import { Meta, Story } from '@storybook/vue3';
import MkNoteSimple from './MkNoteSimple.vue';
const meta = {
	title: 'components/MkNoteSimple',
	component: MkNoteSimple,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNoteSimple,
			},
			props: Object.keys(argTypes),
			template: '<MkNoteSimple v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
