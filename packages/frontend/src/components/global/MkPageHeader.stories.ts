import { Meta, StoryObj } from '@storybook/vue3';
import MkPageHeader from './MkPageHeader.vue';
const meta = {
	title: 'components/global/MkPageHeader',
	component: MkPageHeader,
} satisfies Meta<typeof MkPageHeader>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				MkPageHeader,
			},
			props: Object.keys(argTypes),
			template: '<MkPageHeader v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkPageHeader>;
export default meta;
