import { Meta, StoryObj } from '@storybook/vue3';
import activity_notes from './activity.notes.vue';
const meta = {
	title: 'pages/user/activity.notes',
	component: activity_notes,
} satisfies Meta<typeof activity_notes>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				activity_notes,
			},
			props: Object.keys(argTypes),
			template: '<activity_notes v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof activity_notes>;
export default meta;
