import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, staticFile} from 'remotion';
import {ArrowRight, Hash} from 'lucide-react';

export interface SlideProps {
	title: string;
	body?: string;
	sub?: string;
	points?: string[];
	image?: string;
	background?: string;
	color?: string; // Individual slide theme color
	config: {
		background?: string;
		accent_color?: string;
		primary_color?: string;
		hashtag?: string;
		show_hashtag?: boolean;
		safe_zone?: 'tiktok' | 'stories' | 'none';
		font_size_title?: number;
		font_size_body?: number;
	};
}

const Highlighter: React.FC<{text: string; accentColor: string; isTitle?: boolean}> = ({text, accentColor, isTitle}) => {
	return (
		<>
			{text.split(' ').map((word, i) => {
				const isBlockHighlight = word.startsWith('%');
				const isAccentHighlight = word.startsWith('@');
				const cleanWord = word.replace(/[%@]/g, '');

				if (isBlockHighlight) {
					return (
						<React.Fragment key={i}>
							<span className={`bg-white text-black ${isTitle ? 'px-6 py-2' : 'px-3 py-1'} inline-block`}>
								{cleanWord}
							</span>{' '}
						</React.Fragment>
					);
				}

				if (isAccentHighlight) {
					return (
						<React.Fragment key={i}>
							<span style={{color: accentColor}}>
								{cleanWord}
							</span>{' '}
						</React.Fragment>
					);
				}

				return <React.Fragment key={i}>{word} </React.Fragment>;
			})}
		</>
	);
};

export const Slide: React.FC<SlideProps> = ({
	title,
	body,
	sub,
	points,
	image,
	background,
	color,
	config,
}) => {
	const frame = useCurrentFrame();

	const accentColor = color || config.accent_color || '#00ff88';
	const primaryColor = config.primary_color || '#ffffff';
	const bg = background || config.background || 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)';
	const displayBody = body || sub;

	// Handle local image path
	const imageUrl = image && !image.startsWith('http') ? staticFile(`data/${image}`) : image;

	// Safe Zone Calculations
	const isTikTok = config.safe_zone === 'tiktok';
	const isStories = config.safe_zone === 'stories';
	
	const topMargin = 270; // ~15%
	const bottomMargin = isTikTok ? 670 : (isStories ? 380 : 100);
	const sideMargin = 100; // ~9%

	// Dynamic Font Sizes
	const titleSize = config.font_size_title || (imageUrl ? 80 : 110);
	const bodySize = config.font_size_body || (imageUrl ? 50 : 65);

	// Animations
	const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
	const titleY = interpolate(frame, [5, 20], [50, 0], {extrapolateRight: 'clamp'});
	const listOpacity = interpolate(frame, [20, 35], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: bg, color: primaryColor, fontFamily: 'Inter, sans-serif'}}>
			{/* Content Container (Safe Area) */}
			<div 
				className="absolute flex flex-col"
				style={{
					top: topMargin,
					bottom: bottomMargin,
					left: sideMargin,
					right: sideMargin,
					opacity
				}}
			>
				{/* Header */}
				{config.show_hashtag !== false && (
					<div className={`flex items-center gap-4 mb-12 ${!imageUrl ? 'justify-center' : ''}`}>
						<Hash size={40} color={accentColor} />
						<span className="text-4xl font-bold tracking-tight opacity-70">
							{config.hashtag || 'carousel'}
						</span>
					</div>
				)}

				{/* Main Content Area */}
				<div 
					className={`flex-1 flex flex-col ${!imageUrl ? 'justify-center items-center text-center' : ''}`}
				>
					{/* Title Section */}
					<div
						style={{transform: `translateY(${titleY}px)`}}
						className="space-y-8 w-full"
					>
						<h1 
							style={{fontSize: titleSize}}
							className="font-black uppercase tracking-tighter leading-[1.2]"
						>
							<Highlighter text={title} accentColor={accentColor} isTitle />
						</h1>
						
						{displayBody && (
							<p 
								style={{fontSize: bodySize}}
								className="font-bold opacity-80 leading-[1.4]"
							>
								<Highlighter text={displayBody} accentColor={accentColor} />
							</p>
						)}

						{/* Points List */}
						{points && (
							<ul 
								style={{opacity: listOpacity}}
								className={`mt-12 space-y-12 list-none ${!imageUrl ? 'text-left inline-block' : ''}`}
							>
								{points.map((point, idx) => (
									<li key={idx} className="flex items-start gap-6">
										<div className="w-6 h-6 rounded-full mt-4 flex-shrink-0" style={{backgroundColor: accentColor}} />
										<span 
											style={{fontSize: bodySize}}
											className="font-semibold opacity-90"
										>
											<Highlighter text={point} accentColor={accentColor} />
										</span>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Image Container */}
					{imageUrl && (
						<div
							className="mt-auto mb-12 w-full flex-1 max-h-[700px] min-h-[400px] rounded-[60px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.7)] border border-white/10"
						>
							<img
								src={imageUrl}
								alt="Slide Content"
								className="w-full h-full object-cover"
							/>
						</div>
					)}
				</div>

				{/* Footer - Stays at the bottom of the safe area */}
				<div className="flex justify-between items-center w-full pt-8 h-32">
					<div
						className="h-2 rounded-full flex-1 mr-12"
						style={{backgroundColor: accentColor, opacity: 0.3}}
					/>
					{!imageUrl && <div className="text-4xl font-black opacity-30 uppercase tracking-[0.2em] mr-12">Desliza</div>}
					<div
						className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/10 shadow-lg"
						style={{color: accentColor, backgroundColor: 'rgba(255,255,255,0.05)'}}
					>
						<ArrowRight size={56} strokeWidth={3} />
					</div>
				</div>
			</div>

			{/* Debug Safe Zones (Development Only) */}
			{process.env.NODE_ENV === 'development' && config.safe_zone && (
				<div className="absolute inset-0 pointer-events-none" style={{zIndex: 100}}>
					<div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/30" style={{height: topMargin}} />
					<div className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-red-500/30" style={{height: bottomMargin}} />
					<div className="absolute inset-y-0 left-0 bg-red-500/10 border-r border-red-500/30" style={{width: sideMargin}} />
					<div className="absolute inset-y-0 right-0 bg-red-500/10 border-l border-red-500/30" style={{width: sideMargin}} />
				</div>
			)}
		</AbsoluteFill>
	);
};



