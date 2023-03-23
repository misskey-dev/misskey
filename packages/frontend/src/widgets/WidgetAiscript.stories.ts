/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import WidgetAiscript from './WidgetAiscript.vue';
const meta = {
	title: 'widgets/WidgetAiscript',
	component: WidgetAiscript,
} satisfies Meta<typeof WidgetAiscript>;
export const Default = {
	render(args) {
		return {
			components: {
				WidgetAiscript,
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
			template: '<WidgetAiscript v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof WidgetAiscript>;
export default meta;
