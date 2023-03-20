import { Meta, Story } from '@storybook/vue3';
import MkFileCaptionEditWindow from './MkFileCaptionEditWindow.vue';
const meta = {
	title: 'components/MkFileCaptionEditWindow',
	component: MkFileCaptionEditWindow,
};
export const Default = {
	components: {
		MkFileCaptionEditWindow,
	},
	template: '<MkFileCaptionEditWindow />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
