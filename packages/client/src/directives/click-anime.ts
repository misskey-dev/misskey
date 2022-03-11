import { Directive } from 'vue';
import { defaultStore } from '@/store';

export default {
	mounted(el, binding, vn) {
		/*
		if (!defaultStore.state.animation) return;

		el.classList.add('_anime_bounce_standBy');

		el.addEventListener('mousedown', () => {
			el.classList.add('_anime_bounce_standBy');
			el.classList.add('_anime_bounce_ready');

			el.addEventListener('mouseleave', () => {
				el.classList.remove('_anime_bounce_ready');
			});
		});

		el.addEventListener('click', () => {
			el.classList.add('_anime_bounce');
		});

		el.addEventListener('animationend', () => {
			el.classList.remove('_anime_bounce_ready');
			el.classList.remove('_anime_bounce');
			el.classList.add('_anime_bounce_standBy');
		});
		*/
	}
} as Directive;
