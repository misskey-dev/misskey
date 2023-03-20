import { Meta, Story } from '@storybook/vue3';
import MkPollEditor from './MkPollEditor.vue';
const meta = {
	title: 'components/MkPollEditor',
	component: MkPollEditor,
};
export const Default = {
	components: {
		MkPollEditor,
	},
	template: '<MkPollEditor />',
	parameters: {
		layout: 'centered',
	},
};
export default meta;
