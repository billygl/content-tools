import {Composition, Series, getInputProps} from 'remotion';
import React from 'react';
import {Slide} from './Slide';
import './index.css';
import {calculateSlideDuration} from './utils/duration';
import THEMES from '../public/data/themes.json';
import {CustomComponents} from './custom';

const getStaticScript = () => {
	try {
		// Use require.context to avoid "Module not found" warnings if the file is missing
		const context = (require as any).context('../public/data', false, /script\.json$/);
		if (context.keys().includes('./script.json')) {
			return context('./script.json');
		}
	} catch (e) {
		// Ignore any errors
	}
	return { slides: [], config: {} };
};

const defaultScript = getStaticScript();

export const RemotionRoot: React.FC = () => {
    const inputProps = getInputProps() as any;
	
	// We use the inputProps if they contain slides, otherwise fallback to the bundled script
	const activeScript = (inputProps && inputProps.slides && inputProps.slides.length > 0) ? inputProps : defaultScript;
	const config = activeScript.config || {};
	const thumbnailMode = config.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;

	// Calculate dynamic duration. Must be at least 1 frame to prevent Remotion from crashing.
	const slides = activeScript.slides || [];
	const calculatedDuration = slides.reduce((acc: number, slide: any) => {
		return acc + calculateSlideDuration(slide);
	}, 0) + preRollFrames;
	
	const totalDuration = Math.max(1, calculatedDuration);

	// Support dynamic resolution via input props (for --scale)
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
					slides: activeScript.slides,
					config: activeScript.config,
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
					slides: activeScript.slides,
					config: activeScript.config,
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
					slide: activeScript.slides[0],
					config: activeScript.config,
				}}
			/>
		</>
	);
};

const SlideStillWrapper: React.FC<{slide: any; config: any}> = ({slide, config}) => {
	if (!slide) return null;
	const themeInput = config.theme || 'default';
	const theme = typeof themeInput === 'string' 
		? ((THEMES as any)[themeInput] || (THEMES as any)['default']) 
		: themeInput; // It's an object directly from script.json
	
	const slideBackground = slide.background || theme.backgrounds[0];
	
	if (slide.layout === 'code' && slide.src && CustomComponents[slide.src]) {
		const CustomSlide = CustomComponents[slide.src];
		return <CustomSlide {...slide} config={{...theme, ...config}} background={slideBackground} isStatic />;
	}

	return (
		<Slide 
			{...slide} 
			config={{...theme, ...config}} 
			background={slideBackground} 
			isStatic 
		/>
	);
};

const CarouselVideo: React.FC<{slides: any[]; config: any}> = ({slides, config}) => {
	if (!slides || slides.length === 0) return null;
	const thumbnailMode = config.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;
	
	const themeInput = config.theme || 'default';
	const theme = typeof themeInput === 'string' 
		? ((THEMES as any)[themeInput] || (THEMES as any)['default']) 
		: themeInput;

	return (
		<div className="bg-black w-full h-full">
			<Series>
				{/* Optional Freeze Frame Pre-roll */}
				{thumbnailMode === 'freeze' && (
					<Series.Sequence durationInFrames={preRollFrames}>
						<Slide 
							{...slides[0]} 
							config={{...theme, ...config}} 
							background={slides[0].background || theme.backgrounds[0]} 
							isStatic 
						/>
					</Series.Sequence>
				)}

				{/* Main Content Series */}
				{slides.map((slide, index) => {
					const duration = calculateSlideDuration(slide);
					// If mode is 'static', first slide appears instantly without animation
					const isFirstSlideStatic = index === 0 && thumbnailMode === 'static';
					const slideBackground = slide.background || theme.backgrounds[index % theme.backgrounds.length];

					if (slide.layout === 'code' && slide.src && CustomComponents[slide.src]) {
						const CustomSlide = CustomComponents[slide.src];
						return (
							<Series.Sequence key={index} durationInFrames={duration}>
								<CustomSlide 
									{...slide} 
									config={{...theme, ...config}} 
									background={slideBackground}
									isStatic={isFirstSlideStatic} 
								/>
							</Series.Sequence>
						);
					}
					
					return (
						<Series.Sequence key={index} durationInFrames={duration}>
							<Slide 
								{...slide} 
								config={{...theme, ...config}} 
								background={slideBackground}
								isStatic={isFirstSlideStatic} 
							/>
						</Series.Sequence>
					);
				})}
			</Series>
		</div>
	);
};


