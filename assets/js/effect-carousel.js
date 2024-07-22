/**
 * UI Initiative Carousel Slider
 *
 * Infinite 3D carousel slider
 *
 * https://uiinitiative.com
 *
 * Copyright 2023 UI Initiative
 *
 * Released under the UI Initiative Regular License
 *
 * December 11, 2023
 */
const modals = document.querySelector('.overlay');

document.querySelector('#video-modal-close').addEventListener('click', () => {
	modals.classList.remove('show-modal');
	modals.classList.add('hide-modal');
});

export default function CarouselSlider({ swiper, on, extendParams }) {
	extendParams({
		carouselEffect: {
			opacityStep: 0.33,
			scaleStep: 0.2,
			sideSlides: 2,
		},
	});
	on('beforeInit', () => {
		if (swiper.params.effect !== 'carousel') return;
		console.log(swiper.params.containerModifierClass);
		swiper.classNames.push(`${swiper.params.containerModifierClass}carousel`);
		const overwriteParams = {
			watchSlidesProgress: true,
			centeredSlides: true,
			spaceBetween: 20,
			speed: 200,
		};

		Object.assign(swiper.params, overwriteParams);
		Object.assign(swiper.originalParams, overwriteParams);
	});
	on('click', (e) => {
		swiper.slideTo(e.clickedIndex);

		let curModal = document.querySelector(`#video-modal-${e.clickedSlide.attributes['dataslideid'].value}`);
		let video = curModal.querySelector('#stream-player');
		let options = {
			preload: 'auto',
			html5: {
				hls: {
					limitRenditionByPlayerDimensions: true,
					useDevicePixelRatio: true,
					useNetworkInformationApi: true,
					bandwidth: 6194304,
				},
			},
		};
		let stream = videojs(video, options);

		curModal.classList.remove('hide-modal');
		curModal.classList.add('show-modal');
		stream.play();

		let closeBtn = curModal.querySelector('#video-modal-close');
		closeBtn.addEventListener('click', () => {
			curModal.classList.remove('show-modal');
			curModal.classList.add('hide-modal');
			stream.pause();
		});
	});
	on('progress', () => {
		if (swiper.params.effect !== 'carousel') return;
		const { scaleStep, opacityStep } = swiper.params.carouselEffect;
		const sideSlides = Math.max(Math.min(swiper.params.carouselEffect.sideSlides, 2), 1);

		const zIndexMax = swiper.slides.length;

		for (let i = 0; i < swiper.slides.length; i += 1) {
			const slideEl = swiper.slides[i];
			const slideProgress = swiper.slides[i].progress;

			const absProgress = Math.abs(slideProgress);
			let modify = 1;
			if (absProgress > 1) {
				modify = (absProgress - 1) * 0.3 * (sideSlides === 2 ? 1 : 2) + 1;
			}
			const opacityEls = slideEl.querySelectorAll('.swiper-carousel-animate-opacity');
			const translate = `${slideProgress * modify * 1 * (swiper.rtlTranslate ? -1 : 1)}%`;

			const scale = 1 - absProgress * scaleStep;
			const zIndex = zIndexMax - Math.abs(Math.round(slideProgress));
			slideEl.style.transform = `translateX(${translate}) scale(${scale})`;
			slideEl.style.zIndex = zIndex;

			const fadeEls = slideEl.querySelectorAll('.slowFade');
			if (absProgress > 1.8) {
				fadeEls.forEach((fadeEl) => {
					fadeEl.style.opacity = 0;
					fadeEl.style.transition = 'opacity .8s';
				});
			} else {
				fadeEls.forEach((fadeEl) => {
					fadeEl.style.opacity = 1;
					fadeEl.style.transition = 'opacity .8s';
				});
			}

			opacityEls.forEach((opacityEl) => {
				opacityEl.style.opacity = 1 - absProgress * opacityStep;
			});
		}
	});

	on('setTransition', (s, duration) => {
		if (swiper.params.effect !== 'carousel') return;
		for (let i = 0; i < swiper.slides.length; i += 1) {
			const slideEl = swiper.slides[i];
			const opacityEls = slideEl.querySelectorAll('.swiper-carousel-animate-opacity');
			slideEl.style.transitionDuration = `${duration}ms`;
			opacityEls.forEach((opacityEl) => {
				opacityEl.style.transitionDuration = `${duration}ms`;
			});
		}
	});
}
