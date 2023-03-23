/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetAichan from './WidgetAichan.vue';
const meta = {
	title: 'widgets/WidgetAichan',
	component: WidgetAichan,
} satisfies Meta<typeof WidgetAichan>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetAichan,
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
			template: '<WidgetAichan v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetAichan>;
export default meta;
