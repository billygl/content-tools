import {Composition, Series, getInputProps} from 'remotion';
import React from 'react';
import {Slide} from './Slide';
import './index.css';
import {calculateSlideDuration} from './utils/duration';
import THEMES from '../public/data/themes.json';
import {CustomComponents} from './custom';

export const RemotionRoot: React.FC = () => {
    const inputProps = getInputProps() as any;
	
	// The active script comes from inputProps (CLI)
	let activeScript = (inputProps && inputProps.slides) ? {...inputProps} : {slides: [], config: {}};
	
	// Inject the project folder from the Environment Variable (set in dev.ts)
	const envProjectFolder = (process.env as any).REMOTION_PROJECT_FOLDER;

	if (!activeScript.config) activeScript.config = {};
	if (!activeScript.config.projectFolder && envProjectFolder) {
		activeScript.config.projectFolder = envProjectFolder;
	}
	
	const config = activeScript.config || {};
	const thumbnailMode = config.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;
    
	// Calculate dynamic duration
	const slides = activeScript.slides || [];
	const calculatedDuration = slides.reduce((acc: number, slide: any) => {
		return acc + calculateSlideDuration(slide);
	}, 0) + preRollFrames;
	
	const totalDuration = Math.max(1, calculatedDuration);

	const width = inputProps.width || 1080;
	const height = inputProps.height;

	return (
		<>
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
	const envProjectFolder = (process.env as any).REMOTION_PROJECT_FOLDER;
	const finalConfig = {...config};
	if (!finalConfig.projectFolder && envProjectFolder) {
		finalConfig.projectFolder = envProjectFolder;
	}

	const themeInput = finalConfig.theme || 'default';
	const theme = typeof themeInput === 'string' 
		? ((THEMES as any)[themeInput] || (THEMES as any)['default']) 
		: themeInput;
	
	const slideBackground = slide.background || theme.backgrounds[0];
	
	if (slide.layout === 'code' && slide.src && CustomComponents[slide.src]) {
		const CustomSlide = CustomComponents[slide.src];
		return <CustomSlide {...slide} config={{...theme, ...finalConfig}} background={slideBackground} isStatic />;
	}

	return (
		<Slide 
			{...slide} 
			config={{...theme, ...finalConfig}} 
			background={slideBackground} 
			isStatic 
		/>
	);
};

const CarouselVideo: React.FC<{slides: any[]; config: any}> = ({slides, config}) => {
	if (!slides || slides.length === 0) return null;
	const envProjectFolder = (process.env as any).REMOTION_PROJECT_FOLDER;
	const finalConfig = {...config};
	if (!finalConfig.projectFolder && envProjectFolder) {
		finalConfig.projectFolder = envProjectFolder;
	}

	const thumbnailMode = finalConfig.thumbnail_mode || 'none';
	const preRollFrames = thumbnailMode === 'freeze' ? 15 : 0;
	
	const themeInput = finalConfig.theme || 'default';
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
							config={{...theme, ...finalConfig}} 
							background={slides[0].background || theme.backgrounds[0]} 
							isStatic 
						/>
					</Series.Sequence>
				)}

				{/* Main Content Series */}
				{slides.map((slide, index) => {
					const duration = calculateSlideDuration(slide);
					const isFirstSlideStatic = index === 0 && thumbnailMode === 'static';
					const slideBackground = slide.background || theme.backgrounds[index % theme.backgrounds.length];

					if (slide.layout === 'code' && slide.src && CustomComponents[slide.src]) {
						const CustomSlide = CustomComponents[slide.src];
						return (
							<Series.Sequence key={index} durationInFrames={duration}>
								<CustomSlide 
									{...slide} 
									config={{...theme, ...finalConfig}} 
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
								config={{...theme, ...finalConfig}} 
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


