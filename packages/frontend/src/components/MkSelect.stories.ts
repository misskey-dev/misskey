import { Meta, Story } from '@storybook/vue3';
import MkSelect from './MkSelect.vue';
const meta = {
	title: 'components/MkSelect',
	component: MkSelect,
};
export const Default = {
	components: {
		MkSelect,
	},
	template: '<MkSelect />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
