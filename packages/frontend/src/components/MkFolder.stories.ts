import { Meta, Story } from '@storybook/vue3';
import MkFolder from './MkFolder.vue';
const meta = {
	title: 'components/MkFolder',
	component: MkFolder,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFolder,
			},
			props: Object.keys(argTypes),
			template: '<MkFolder v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
