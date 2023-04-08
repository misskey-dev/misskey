export function embedInitLinkAnime() {
    const animeEl: NodeListOf<HTMLElement> = document.querySelectorAll("a.click-anime,button.click-anime");
    if (animeEl.length > 0) {
        animeEl.forEach((el: HTMLElement) => {
            const target = el.children[0];

            if (target == null) return;

            target.classList.add('_anime_bounce_standBy');

            el.addEventListener('mousedown', () => {
                target.classList.remove('_anime_bounce');

                target.classList.add('_anime_bounce_standBy');
                target.classList.add('_anime_bounce_ready');

                target.addEventListener('mouseleave', () => {
                    target.classList.remove('_anime_bounce_ready');
                });
            });

            el.addEventListener('click', () => {
                target.classList.add('_anime_bounce');
                target.classList.remove('_anime_bounce_ready');
            });

            el.addEventListener('animationend', () => {
                target.classList.remove('_anime_bounce');
                target.classList.add('_anime_bounce_standBy');
            });
        });
    }
}