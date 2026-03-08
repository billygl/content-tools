import {Composition, Series} from 'remotion';
import {Slide} from './Slide';
import './index.css';
import script from '../public/data/script.json';
import {calculateSlideDuration} from './utils/duration';

export const RemotionRoot: React.FC = () => {
	// Calculate dynamic duration by summing all individual slide durations
	const totalDuration = script.slides.reduce((acc, slide) => {
		return acc + calculateSlideDuration(slide);
	}, 0);

	return (
		<>
			<Composition
				id="CarouselVideo"
				component={CarouselVideo}
				durationInFrames={totalDuration}
				fps={30}
				width={1080}
				height={1920}
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
				width={1080}
				height={1920}
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
	return <Slide {...slide} config={config} />;
};

const CarouselVideo: React.FC<{slides: any[]; config: any}> = ({slides, config}) => {
	if (!slides || slides.length === 0) return null;
	return (
		<div className="bg-black w-full h-full">
			<Series>
				{slides.map((slide, index) => {
					const duration = calculateSlideDuration(slide);
					return (
						<Series.Sequence key={index} durationInFrames={duration}>
							<Slide {...slide} config={config} />
						</Series.Sequence>
					);
				})}
			</Series>
		</div>
	);
};


