import { Meta, StoryObj } from '@storybook/vue3';
import MkFileCaptionEditWindow from './MkFileCaptionEditWindow.vue';
const meta = {
	title: 'components/MkFileCaptionEditWindow',
	component: MkFileCaptionEditWindow,
} satisfies Meta<typeof MkFileCaptionEditWindow>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFileCaptionEditWindow,
			},
			props: Object.keys(argTypes),
			template: '<MkFileCaptionEditWindow v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFileCaptionEditWindow>;
export default meta;
