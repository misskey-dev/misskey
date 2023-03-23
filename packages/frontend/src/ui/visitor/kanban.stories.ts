/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import kanban_ from './kanban.vue';
const meta = {
	title: 'ui/visitor/kanban',
	component: kanban_,
} satisfies Meta<typeof kanban_>;
export const Default = {
	render(args) {
		return {
			components: {
				kanban_,
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
			template: '<kanban_ v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof kanban_>;
export default meta;
