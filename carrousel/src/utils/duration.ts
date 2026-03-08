import {SlideProps} from '../Slide';

export const calculateSlideDuration = (slide: any, fps: number = 30): number => {
	// If manual duration is provided in frames, use it
	if (slide.duration) {
		return slide.duration;
	}

	// Smart Duration Calculation
	const baseFrames = 90; // 3 seconds for animations/breathing room
	
	// Collect all text content
	let textContent = slide.title || '';
	if (slide.body) textContent += ' ' + slide.body;
	if (slide.sub) textContent += ' ' + slide.sub;
	if (slide.points) textContent += ' ' + slide.points.join(' ');

	// Character-based calculation: +1 frame for every 2 characters
	const textFrames = Math.ceil(textContent.length / 2.0);
	
	const totalFrames = baseFrames + textFrames;

	// Clamp between 5 seconds (150 frames) and 15 seconds (450 frames)
	const minFrames = 150;
	const maxFrames = 450;

	return Math.min(Math.max(totalFrames, minFrames), maxFrames);
};
