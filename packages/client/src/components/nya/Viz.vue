<template>
<div
	ref="wrapper" class="wrapper" :class="{
		'playing': isPlaying
	}"
>
	<canvas ref="vizplayer" class="vizplayer"/>
	<div ref="cover" class="cover">
		<div ref="coverIcon" class="cover-icon fas fa-music"/>
	</div>
	<div class="control-bar">
		<div class="button" @click="togglePlay">
			<i v-if="isLoading" class="fa fa-spinner fa-spin"/>
			<i v-else-if="isPlaying" class="fas fa-pause"/>
			<i v-else class="fas fa-play"/>
		</div>
		<div class="time">
			<span ref="timeNow" class="now">00:00</span>
			<span class="divider">/</span>
			<span ref="timeFull" class="full">00:00</span>
		</div>
		<div
			class="process-bar"
			@mouseenter="startSeeking"
			@mouseleave="endSeeking"
			@mousemove="seekProgress"
			@click="jumpProgress"
		>
			<div ref="barFull" class="bar full"/>
			<div ref="barBuffered" class="bar buffered"/>
			<div ref="barPlayed" class="bar played"/>
			<div ref="seeker" class="seeker">
				<div class="ball"/>
			</div>
		</div>
	</div>
	<div class="volume-control">
		<div class="volume-bar" @click="jumpVolume">
			<div ref="barVolumeFull" class="bar full"/>
			<div v-show="!isMuted" ref="barVolumeNow" class="bar now"/>
		</div>
		<div class="mute-button" @click="toggleMute">
			<i v-if="isMuted" class="fas fa-volume-off"/>
			<i v-else class="fas fa-volume-high"/>
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { ColdDeviceStorage } from '@/store';

const props = defineProps({
	audioSrc: String,
});

const wrapper = ref<HTMLDivElement | null>(null);
const vizplayer = ref<HTMLCanvasElement | null>(null);
const cover = ref<HTMLDivElement | null>(null);
const coverIcon = ref<HTMLDivElement | null>(null);

const timeNow = ref<HTMLSpanElement | null>(null);
const timeFull = ref<HTMLSpanElement | null>(null);
const barFull = ref<HTMLDivElement | null>(null);
const barBuffered = ref<HTMLDivElement | null>(null);
const barPlayed = ref<HTMLDivElement | null>(null);
const seeker = ref<HTMLDivElement | null>(null);

const barVolumeFull = ref<HTMLDivElement | null>(null);
const barVolumeNow = ref<HTMLDivElement | null>(null);

onMounted(() => {
	if (props.audioSrc) {
		// Initialize
		init(props.audioSrc);
	} else {
		console.error('audio is required');
	}
});

onBeforeUnmount(() => {
	// Pause audio
	if (!audio.paused) {
		audio.pause();
	}
});

// Define constants
const FREQ_BIN_COUNT = 256; // Half of FFT size
const FRAGMENTS_SETTINGS = {
	count: 256, // Count of random fragments
	minRadius: 1 / 150,
	maxRadius: 1 / 60,
	stepRadius: 1 / 2000, // Increases per 20ms
	stepAngle: 1.5,
};
const ANGLE_STEP = 0.3; // Change angle per 20ms
const RADIUS_LIMIT = {
	min: 1 / 5,
	max: 3 / 8,
};
const ASPECT_RATIO = 16 / 9;

// Define variables
let analyser: AnalyserNode;
let audio: HTMLAudioElement;
let context: AudioContext;
let cctx: CanvasRenderingContext2D;
let canvasSize: {
  width: number,
  height: number,
};
let freqMultiplyRate: {
  radius: number,
  angleInDegrees: number,
};
let fragmentSize: {
  minSelfRadius: number,
  maxSelfRadius: number,
  minPositionRadius: number,
  maxPositionRadius: number,
  stepRadius: number,
};

// Define state
let isContextResumed = false;
let angleOffset = 0;
let stepEventId: ReturnType<typeof setInterval> | null = null;
let flushEventId = 0;
const isLoading = ref(true);
const isPlaying = ref(false);
const isMuted = ref(false);
let isSeeking = false;
let colors = {
	bg: '#333',
	freq: '#fff',
	fragments: '#fff6',
};

// Define types
type FragmentProps = {
  selfRadius: number,
  selfAngle: number,
  positionRadius: number,
  positionAngle: number,
  stepRadius: number,
  stepAngle: number,
};

// Prepare data array
const dataArray = new Uint8Array(FREQ_BIN_COUNT);
const fragmentsArray = new Array<FragmentProps>(FRAGMENTS_SETTINGS.count);

// Initialize function
const init = (src: string) => {
	if (wrapper.value) {
		initCanvasSize(wrapper.value.clientWidth);
		initAudio(src);
		initAudioAnalyser();
		initFragments();
		initWrapperBG();

		new ResizeObserver(() => {
			if (wrapper.value?.clientWidth) {
				initCanvasSize(wrapper.value.clientWidth);
				initFragmentsSize();

				// Flush canvas
				if (flushEventId === 0) {
					requestAnimationFrame(render);
				} // else will be auto flushed
			}
		}).observe(wrapper.value!);

		// Start render
		requestAnimationFrame(render);
	}
};

const initCanvasSize = (width: number) => {
	canvasSize = {
		width,
		height: width / ASPECT_RATIO, // Reserve space for status bar
	};
	if (vizplayer.value) {
		vizplayer.value.width = canvasSize.width;
		vizplayer.value.height = canvasSize.height;
	}
	freqMultiplyRate = {
		radius: canvasSize.height * (RADIUS_LIMIT.max - RADIUS_LIMIT.min) / 256, // (2/3-1/4)/2=5/24 , 0 - 255
		angleInDegrees: 360 / FREQ_BIN_COUNT,
	};
	if (vizplayer.value) {
		cctx = vizplayer.value.getContext('2d')!;
	}

	// Set cover size
	if (cover.value) {
		cover.value.style.width = `${canvasSize.height * RADIUS_LIMIT.min * 2 - 6}px`;
		cover.value.style.height = `${canvasSize.height * RADIUS_LIMIT.min * 2 - 6}px`;
	}
	if (coverIcon.value) {
		coverIcon.value.style.fontSize = `${canvasSize.height * RADIUS_LIMIT.min}px`;
	}

	// Set line style
	cctx.strokeStyle = colors.freq;
	cctx.lineWidth = canvasSize.height / 4 * 2 * Math.PI / FREQ_BIN_COUNT * 2 / 3;
	cctx.lineJoin = 'round';
	cctx.lineCap = 'round';
};

const initAudio = (src: string) => {
	// Load media
	audio = new Audio(src);
	audio.autoplay = false;
	audio.crossOrigin = 'anonymous';
	const savedVolume = ColdDeviceStorage.get('mediaVolume');
	if (savedVolume) {
		audio.volume = savedVolume;
	}

	// Update status when audio status changed
	audio.addEventListener('pause', () => {
		isPlaying.value = false;
		stopStep();
	});
	audio.addEventListener('play', () => {
		isPlaying.value = true;
		startStep();
	});
	audio.addEventListener('durationchange', () => {
		// Flush status
		//// Update time
		if (timeFull.value) {
			timeFull.value.innerText = parseSecondsToTime(audio.duration);
		}
	});
	audio.addEventListener('progress', (e) => {
		// Buffered more
		//// Update buffered progress
		////// Find latest buffer
		let latestBuffered = 0;
		for (let i = 0; i < audio.buffered.length; i++) {
			if (audio.buffered.end(i) > latestBuffered) {
				latestBuffered = audio.buffered.end(i);
			}
		}
		////// Update progress style
		barBuffered.value!.style.width = `${latestBuffered / audio.duration * 100}%`;
	});
	audio.addEventListener('waiting', () => {
		isPlaying.value = false;
		isLoading.value = true;
	});
	audio.addEventListener('playing', () => {
		isPlaying.value = true;
		isLoading.value = false;
	});
	audio.addEventListener('canplay', () => {
		isLoading.value = false;
	});

	// Init volume
	if (barVolumeNow.value) {
		barVolumeNow.value.style.height = `${audio.volume * 100}%`;
	}
};

const initAudioAnalyser = () => {
	// Cross browser support
	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const AudioContext = window.AudioContext || window.webkitAudioContext;

	// Init Audio Context
	context = new AudioContext();

	// Create element
	const source = context.createMediaElementSource(audio);
	analyser = context.createAnalyser();

	// Connect chain
	source.connect(analyser);
	analyser.connect(context.destination);

	// Initialize analyser
	analyser.fftSize = FREQ_BIN_COUNT << 1;
};

const initFragmentsSize = () => {
	const minPositionRadius = RADIUS_LIMIT.min * canvasSize.height;
	fragmentSize = {
		minSelfRadius: FRAGMENTS_SETTINGS.minRadius * canvasSize.height,
		maxSelfRadius: FRAGMENTS_SETTINGS.maxRadius * canvasSize.height,
		minPositionRadius,
		maxPositionRadius: canvasSize.width / 2 - minPositionRadius,
		stepRadius: FRAGMENTS_SETTINGS.stepRadius * canvasSize.width,
	};
};

const initFragments = () => {
	initFragmentsSize();
	for (let i = 0; i < FRAGMENTS_SETTINGS.count; i++) {
		fragmentsArray[i] = {
			selfRadius: Math.random() * (fragmentSize.maxSelfRadius - fragmentSize.minSelfRadius) + fragmentSize.minSelfRadius,
			selfAngle: Math.random() * 360,
			positionRadius: Math.random() * (fragmentSize.maxPositionRadius - fragmentSize.minPositionRadius) + fragmentSize.minPositionRadius,
			positionAngle: Math.random() * 360,
			stepRadius: (Math.random() * 0.5 + 0.5) * fragmentSize.stepRadius,
			stepAngle: (Math.random() * 2 - 1) * FRAGMENTS_SETTINGS.stepAngle,
		};
		drawFragment(fragmentsArray[i]);
	}
};

const initWrapperBG = () => {
	if (wrapper.value) {
		wrapper.value.style.backgroundColor = colors.bg;
	}
};

const startStep = () => {
	if (stepEventId === null) {
		stepEventId = setInterval(() => {
			// Angle step
			angleOffset += ANGLE_STEP;

			// Fragments step
			for (let i = 0; i < FRAGMENTS_SETTINGS.count; i++) {
				fragmentsArray[i].positionRadius += fragmentsArray[i].stepRadius;
				fragmentsArray[i].selfAngle += fragmentsArray[i].stepAngle;
			}
		}, 20);
	}
	if (flushEventId === 0) {
		// Start render
		flushEventId = requestAnimationFrame(render);
	}
};

const stopStep = () => {
	if (stepEventId !== null) {
		clearInterval(stepEventId);
		stepEventId = null;
	}
	if (flushEventId !== 0) {
		cancelAnimationFrame(flushEventId);
		flushEventId = 0;
	}
};

const render = () => {
	// Get Frequency data
	analyser.getByteFrequencyData(dataArray);

	// Clear canvas
	cctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
	cctx.fillStyle = colors.bg;
	cctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

	// Draw frequency data
	cctx.fillStyle = colors.freq;
	for (let i = 0; i < FREQ_BIN_COUNT >> 1; i++) {
		// Only select lower half to optimize visual effects
		// (otherwise it will be too empty)
		cctx.beginPath();
		const angleInDegree = freqMultiplyRate.angleInDegrees * i * 2 + angleOffset;
		const startPoint = convertPolarToCartesian(
			canvasSize.height * RADIUS_LIMIT.min,
			angleInDegree,
		);
		cctx.moveTo(startPoint.x, startPoint.y); // Start point
		const endPoint = convertPolarToCartesian(
			dataArray[i] * freqMultiplyRate.radius * (audio.volume * 0.5 + 0.5) + canvasSize.height * RADIUS_LIMIT.min,
			angleInDegree,
		);
		cctx.lineTo(
			endPoint.x, endPoint.y,
		);
		cctx.stroke();
		cctx.closePath();
	}

	// Draw fragments
	for (let i = 0; i < FRAGMENTS_SETTINGS.count; i++) {
		if (!drawFragment(fragmentsArray[i])) {
			const selfRadius = Math.random() * (fragmentSize.maxSelfRadius - fragmentSize.minSelfRadius) + fragmentSize.minSelfRadius;
			fragmentsArray[i] = {
				selfRadius,
				selfAngle: Math.random() * 360,
				positionRadius: fragmentSize.minPositionRadius - selfRadius,
				positionAngle: Math.random() * 360,
				stepRadius: (Math.random() * 0.5 + 0.5) * fragmentSize.stepRadius,
				stepAngle: (Math.random() * 2 - 1) * FRAGMENTS_SETTINGS.stepAngle,
			};
			drawFragment(fragmentsArray[i]);
		}
	}

	// Update progress
	//// Update played progress
	const playedPercent = audio.currentTime / audio.duration * 100;
  barPlayed.value!.style.width = `${playedPercent}%`;
  if (!isSeeking) {
    timeNow.value!.innerText = parseSecondsToTime(audio.currentTime);
    seeker.value!.style.left = `${playedPercent}%`;
  }
  }

  if (flushEventId !== 0) {
		// Not single run
    requestAnimationFrame(render);
  }
};

const convertPolarToCartesian = (radius: number, angleInDegrees: number, offsetX = canvasSize.width / 2, offsetY = canvasSize.height / 2) => {
	const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);

	return {
		x: radius * Math.cos(angleInRadians) + offsetX,
		y: radius * Math.sin(angleInRadians) + offsetY,
	};
};

const parseSecondsToTime = (seconds: number): string => {
	const sec = Math.floor(seconds % 60);
	const min = Math.floor(seconds / 60);
	return `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
};

const togglePlay = () => {
	if (!isLoading.value && audio.paused) {
		if (!isContextResumed) {
			// Resume audio
			context.resume();
			// Update status
			isContextResumed = true;
		}

		audio.play();
	} else {
		audio.pause();
	}
};

const startSeeking = () => {
	isSeeking = true;
};

const endSeeking = () => {
	isSeeking = false;

	// Seeker homing
	const playedPercent = audio.currentTime / audio.duration * 100;
	if (timeNow.value) {
		timeNow.value.innerText = parseSecondsToTime(audio.currentTime);
	}
	if (barPlayed.value) {
		barPlayed.value.style.width = `${playedPercent}%`;
	}
	if (seeker.value) {
		seeker.value.style.left = `${playedPercent}%`;
	}
};

const seekProgress = (event: MouseEvent) => {
	if (barFull.value) {
		const seekPercent = event.offsetX / barFull.value.clientWidth;
		const seekTime = Math.floor(seekPercent * (isNaN(audio.duration) ? 0 : audio.duration));
		if (timeNow.value) {
			timeNow.value.innerText = parseSecondsToTime(seekTime);
		}
		if (barPlayed.value) {
			barPlayed.value.style.width = `${seekPercent * 100}%`;
		}
		if (seeker.value) {
			seeker.value.style.left = `${seekPercent * 100}%`;
		}
	}
};

const jumpProgress = (event: MouseEvent) => {
	if (barFull.value) {
		const seekPercent = event.offsetX / barFull.value.clientWidth;
		setProgress(seekPercent * (isNaN(audio.duration) ? 0 : audio.duration));
	}
};

const setProgress = (pTime: number) => {
	let time = pTime;
	if (time < 0) {
		time = 0;
	} else if (time > audio.duration) {
		time = audio.duration;
	}
	audio.currentTime = time;
};

const toggleMute = () => {
	audio.muted = !audio.muted;
	isMuted.value = audio.muted;
};

const jumpVolume = (event: MouseEvent) => {
	if (barVolumeFull.value) {
		const volumePercent = (barVolumeFull.value.clientHeight - event.offsetY) / barVolumeFull.value.clientHeight;
		setVolume(volumePercent);
	}
};

const setVolume = (pVolumePercent: number) => {
	let volumePercent = pVolumePercent;
	if (volumePercent < 0) {
		if (!isMuted.value) {
			toggleMute();
		}
		return;
	} else if (volumePercent > 1) {
		volumePercent = 1;
	}
	if (isMuted.value) {
		toggleMute();
	}
	audio.volume = volumePercent;
	if (barVolumeNow.value) {
		barVolumeNow.value.style.height = `${volumePercent * 100}%`;
	}

	// Save volume
	ColdDeviceStorage.set('mediaVolume', audio.volume);

};

const drawFragment = (fragmentProps: FragmentProps) => {
	// Calculate fragment position
	const center = convertPolarToCartesian(fragmentProps.positionRadius, fragmentProps.positionAngle);

	// Calculate if is on canvas
	if (
		center.x + fragmentProps.selfRadius < 0 || center.x - fragmentProps.selfRadius > canvasSize.width ||
      center.y + fragmentProps.selfRadius < 0 || center.y - fragmentProps.selfRadius > canvasSize.height
	) {
		// Outside of canvas
		return false;
	} else {
		// Inside, draw
		// Calc 3 points
		const vertexes = [
			convertPolarToCartesian(fragmentProps.selfRadius, fragmentProps.selfAngle, center.x, center.y),
			convertPolarToCartesian(fragmentProps.selfRadius, 120 + fragmentProps.selfAngle, center.x, center.y),
			convertPolarToCartesian(fragmentProps.selfRadius, 240 + fragmentProps.selfAngle, center.x, center.y),
		];

		cctx.fillStyle = colors.fragments;
		cctx.beginPath();
		cctx.moveTo(vertexes[0].x, vertexes[0].y);
		cctx.lineTo(vertexes[1].x, vertexes[1].y);
		cctx.lineTo(vertexes[2].x, vertexes[2].y);
		cctx.lineTo(vertexes[0].x, vertexes[0].y);
		cctx.closePath();
		cctx.fill();

		return true;
	}
};

</script>
<style scoped lang="scss">
* {
  user-select: none;
}
.wrapper {
  overflow: hidden;
  position: relative;
}
.vizplayer {
  display: block;
}
.cover {
	position: absolute;
	border-radius: 100%;
	top: 0;
	bottom: 0;
	left: 0;
	right: 0;
	margin: auto;
	background-color: #eee;

	display: flex;
	justify-content: center;
	align-items: center;
}
.cover-icon {
	color: #333;
}
.control-bar {
  width: 100%;
  position: relative;

  > * {
    position: absolute;
  }
  > .process-bar {
    position: relative;
    width: 100%;
    cursor: pointer;
    > * {
      position: absolute;
    }
    > .bar {
      bottom: 0;
      height: .15rem;
      transition: height .3s ease-in-out;

      &.full {
        width: 100%;
        background-color: #888;
      }
      &.buffered {
        background-color: #bbb;
        pointer-events: none;
      }
      &.played {
        background-color: #96baf3;
        pointer-events: none;
      }
    }
    > .seeker {
      bottom: 0;
      transition: bottom .3s ease-in-out;
      pointer-events: none;
      > .ball {
        position: absolute;
        width: .4rem;
        height: .4rem;
        border-radius: 100%;
        top: -.4rem;
        left: -.2rem;
        background-color: #fff;
        border: 1px solid #3333;
      }
    }
  }
  .time {
    opacity: 0;
    transition: opacity .3s;
    color: #fffc;
    right: 0.5rem;
    top: -2rem;

    > span {
      margin: 2px;
    }

    > .divider {
      font-weight: bold;
    }
  }
  .button {
    cursor: pointer;
    width: 1.8rem;
    height: 1.8rem;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #aaa6;
    border-radius: 100%;
    opacity: 0;
    transition: opacity .3s ease-in-out;
    color: #fffc;
    left: 0.6rem;
    top: -2.7rem;
  }
}

.volume-control {
  display: flex;
  flex-direction: column;
  position: absolute;
  padding: 1rem;
  height: 50%;
  right: 0;
  top: 0;
  bottom: 0;
  margin: auto;
  align-items: center;
  gap: .5rem;
  opacity: 0;
  transition: opacity .3s ease-in-out;

  > * {
    display: flex;
  }

  .volume-bar {
    flex-grow: 1;
    width: .5rem;
    border-radius: .5rem;
    position: relative;

    > .bar {
      position: absolute;
      width: 100%;
      border-radius: .5rem;
      bottom: 0;
    }

    > .full {
      cursor: pointer;
      background-color: #fff3;
      height: 100%;
    }

    > .now {
      background-color: #fff6;
      pointer-events: none;
    }
  }
  .mute-button {
    color: #ccc;
    cursor: pointer;
		width: 1.5rem;
  }
}

.wrapper:not(.playing), .wrapper.playing:hover {
  .control-bar {
    > .process-bar {
      > .bar {
        height: .3rem;
      }
      > .seeker {
        bottom: .15rem;
      }
    }
    .time, .button {
      opacity: 1;
    }
  }
}

.wrapper:hover {
  .volume-control {
    opacity: 1;
  }
}
</style>
