/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkFoldableSection from './MkFoldableSection.vue';
const meta = {
	title: 'components/MkFoldableSection',
	component: MkFoldableSection,
} satisfies Meta<typeof MkFoldableSection>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkFoldableSection,
			},
			props: Object.keys(argTypes),
			template: '<MkFoldableSection v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkFoldableSection>;
export default meta;
