import { Meta, Story } from '@storybook/vue3';
import MkAutocomplete from './MkAutocomplete.vue';
const meta = {
	title: 'components/MkAutocomplete',
	component: MkAutocomplete,
};
export const Default = {
	components: {
		MkAutocomplete,
	},
	template: '<MkAutocomplete />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
