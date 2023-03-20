import { Meta, Story } from '@storybook/vue3';
import MkPollEditor from './MkPollEditor.vue';
const meta = {
	title: 'components/MkPollEditor',
	component: MkPollEditor,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPollEditor,
			},
			props: Object.keys(argTypes),
			template: '<MkPollEditor v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
};
export default meta;
