/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetPostForm from './WidgetPostForm.vue';
const meta = {
	title: 'widgets/WidgetPostForm',
	component: WidgetPostForm,
} satisfies Meta<typeof WidgetPostForm>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetPostForm,
			},
			setup() {
				return {
					args,
				};
			},
			computed: {
				props() {
					return {
						...args,
					};
				},
			},
			template: '<WidgetPostForm v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetPostForm>;
export default meta;
