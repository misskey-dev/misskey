import { Meta, Story } from '@storybook/vue3';
import MkFileListForAdmin from './MkFileListForAdmin.vue';
const meta = {
	title: 'components/MkFileListForAdmin',
	component: MkFileListForAdmin,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFileListForAdmin,
			},
			props: Object.keys(argTypes),
			template: '<MkFileListForAdmin v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
