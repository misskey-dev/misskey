/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import MkMarquee from './MkMarquee.vue';
const meta = {
	title: 'components/MkMarquee',
	component: MkMarquee,
} satisfies Meta<typeof MkMarquee>;
export const Default = {
	render(args) {
		return {
			components: {
				MkMarquee,
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
			template: '<MkMarquee v-bind="props" />',
		};
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkMarquee>;
export default meta;
