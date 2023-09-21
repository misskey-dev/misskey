/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { StoryObj } from '@storybook/vue3';
import isChromatic from 'chromatic/isChromatic';
import MkEllipsis from './MkEllipsis.vue';
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
						...this.args,
					};
				},
			},
			template: '<MkEllipsis v-bind="props" />',
		};
	},
	args: {
		static: isChromatic(),
	},
	parameters: {
		layout: 'centered',
	},
} satisfies StoryObj<typeof MkEllipsis>;
