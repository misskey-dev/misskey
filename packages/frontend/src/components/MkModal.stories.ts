import { Meta, Story } from '@storybook/vue3';
import MkModal from './MkModal.vue';
const meta = {
	title: 'components/MkModal',
	component: MkModal,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkModal,
			},
			props: Object.keys(argTypes),
			template: '<MkModal v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
