import { Meta, Story } from '@storybook/vue3';
import MkAutocomplete from './MkAutocomplete.vue';
const meta = {
	title: 'components/MkAutocomplete',
	component: MkAutocomplete,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkAutocomplete,
			},
			props: Object.keys(argTypes),
			template: '<MkAutocomplete v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
