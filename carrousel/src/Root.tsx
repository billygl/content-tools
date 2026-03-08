import {Composition, Series, getInputProps} from 'remotion';
import {Slide} from './Slide';
import './index.css';
import script from '../public/data/script.json';
import {calculateSlideDuration} from './utils/duration';

export const RemotionRoot: React.FC = () => {
	const config = script.config as any;
	const thumbnailMode = config.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;

	// Calculate dynamic duration by summing all individual slide durations
	const totalDuration = script.slides.reduce((acc, slide) => {
		return acc + calculateSlideDuration(slide);
	}, 0) + preRollFrames;

	// Support dynamic resolution via input props (for --scale)
	const inputProps = getInputProps() as {width?: number; height?: number};
	const width = inputProps.width || 1080;
	const height = inputProps.height;

	return (
		<>
			{/* Format 9:16 (Vertical) */}
			<Composition
				id="Carousel-9-16"
				component={CarouselVideo}
				durationInFrames={totalDuration}
				fps={30}
				width={width}
				height={height || 1920}
				defaultProps={{
					slides: script.slides,
					config: script.config,
				}}
			/>

			{/* Format 4:5 (Portrait) */}
			<Composition
				id="Carousel-4-5"
				component={CarouselVideo}
				durationInFrames={totalDuration}
				fps={30}
				width={width}
				height={height || 1350}
				defaultProps={{
					slides: script.slides,
					config: script.config,
				}}
			/>

			<Composition
				id="SlideStill"
				component={SlideStillWrapper}
				durationInFrames={150}
				fps={30}
				width={width}
				height={height || 1920}
				defaultProps={{
					slide: script.slides[0],
					config: script.config,
				}}
			/>
		</>
	);
};

const SlideStillWrapper: React.FC<{slide: any; config: any}> = ({slide, config}) => {
	if (!slide) return null;
	return <Slide {...slide} config={config} isStatic />;
};

const CarouselVideo: React.FC<{slides: any[]; config: any}> = ({slides, config}) => {
	if (!slides || slides.length === 0) return null;
	const thumbnailMode = config.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;

	return (
		<div className="bg-black w-full h-full">
			<Series>
				{/* Optional Freeze Frame Pre-roll */}
				{thumbnailMode === 'freeze' && (
					<Series.Sequence durationInFrames={preRollFrames}>
						<Slide {...slides[0]} config={config} isStatic />
					</Series.Sequence>
				)}

				{/* Main Content Series */}
				{slides.map((slide, index) => {
					const duration = calculateSlideDuration(slide);
					// If mode is 'static', first slide appears instantly without animation
					const isFirstSlideStatic = index === 0 && thumbnailMode === 'static';
					
					return (
						<Series.Sequence key={index} durationInFrames={duration}>
							<Slide 
								{...slide} 
								config={config} 
								isStatic={isFirstSlideStatic} 
							/>
						</Series.Sequence>
					);
				})}
			</Series>
		</div>
	);
};


