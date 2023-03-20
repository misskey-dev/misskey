import { Meta, Story } from '@storybook/vue3';
import page_note from './page.note.vue';
const meta = {
	title: 'components/page/page.note',
	component: page_note,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_note,
			},
			props: Object.keys(argTypes),
			template: '<page_note v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
