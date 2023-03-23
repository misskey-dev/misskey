/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkEllipsis from './MkEllipsis.vue';
const meta = {
	title: 'components/global/MkEllipsis',
	component: MkEllipsis,
} satisfies Meta<typeof MkEllipsis>;
export const Default = {
	render(args) {
		return {
			components: {
				MkEllipsis,
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
			template: '<MkEllipsis v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEllipsis>;
export default meta;
