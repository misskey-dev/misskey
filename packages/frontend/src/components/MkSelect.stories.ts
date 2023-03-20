import { Meta, Story } from '@storybook/vue3';
import MkSelect from './MkSelect.vue';
const meta = {
	title: 'components/MkSelect',
	component: MkSelect,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkSelect,
			},
			props: Object.keys(argTypes),
			template: '<MkSelect v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
