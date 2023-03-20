import { Meta, Story } from '@storybook/vue3';
import MkNote from './MkNote.vue';
const meta = {
	title: 'components/MkNote',
	component: MkNote,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkNote,
			},
			props: Object.keys(argTypes),
			template: '<MkNote v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
