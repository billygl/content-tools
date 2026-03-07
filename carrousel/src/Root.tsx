import {Composition, Series} from 'remotion';
import {Slide} from './Slide';
import './index.css';
import script from '../public/data/script.json';

export const RemotionRoot: React.FC = () => {
	const duration = script.slides.length * 150;

	return (
		<>
			<Composition
				id="CarouselVideo"
				component={CarouselVideo}
				durationInFrames={duration}
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
				durationInFrames={30}
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
				{slides.map((slide, index) => (
					<Series.Sequence key={index} durationInFrames={150}>
						<Slide {...slide} config={config} />
					</Series.Sequence>
				))}
			</Series>
		</div>
	);
};


