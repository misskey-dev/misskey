/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkObjectView from './MkObjectView.vue';
const meta = {
	title: 'components/MkObjectView',
	component: MkObjectView,
} satisfies Meta<typeof MkObjectView>;
export const Default = {
	render(args) {
		return {
			components: {
				MkObjectView,
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
			template: '<MkObjectView v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkObjectView>;
export default meta;
