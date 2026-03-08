import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, staticFile, Img} from 'remotion';
import {ArrowRight, Hash} from 'lucide-react';

export interface SlideProps {
	title: string;
	body?: string;
	sub?: string;
	points?: string[];
	image?: string;
	image_style?: {
		zoom?: number;
		fit?: 'cover' | 'contain' | 'fill' | 'none';
		position?: string;
	};
	type?: 'intro' | 'content' | 'outro';
	duration?: number;
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
		author?: {
			name: string;
			handle: string;
			avatar?: string;
		};
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
	image_style,
	type = 'content',
	background,
	color,
	config,
}) => {
	const frame = useCurrentFrame();
	const isOutro = type === 'outro';
	const imageUrl = image && !image.startsWith('http') ? staticFile(`data/${image}`) : image;

	// Layout Centralization - Avoiding excessive ternary operators
	const layout = {
		top: 270,
		side: 100,
		// Outro slides bypass safe zones for impact, content slides respect them (TikTok/Stories)
		bottom: isOutro 
			? 100 
			: config.safe_zone === 'tiktok' ? 670 : (config.safe_zone === 'stories' ? 380 : 150),
		// Dynamic Font Sizes
		titleSize: config.font_size_title || (isOutro ? 130 : (imageUrl ? 80 : 110)),
		bodySize: config.font_size_body || (isOutro ? 80 : (imageUrl ? 60 : 80)),
		// Spacing adjustments
		contentPaddingTop: isOutro ? 200 : 0,
		headerJustify: (!imageUrl || isOutro) ? 'justify-center' : 'justify-start',
	};

	const accentColor = color || config.accent_color || '#00ff88';
	const primaryColor = config.primary_color || '#ffffff';
	const bg = background || config.background || 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)';
	const displayBody = body || sub;

	const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
	const titleY = interpolate(frame, [5, 20], [50, 0], {extrapolateRight: 'clamp'});
	const listOpacity = interpolate(frame, [20, 35], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background: bg, color: primaryColor, fontFamily: 'Inter, sans-serif', overflow: 'hidden'}}>
			{/* Big background watermark */}
			<div 
				className="absolute -bottom-20 -right-20 text-[350px] font-black opacity-10 uppercase tracking-tighter pointer-events-none select-none z-0"
				style={{ color: accentColor, lineHeight: 0.8 }}
			>
				{isOutro ? 'Fin' : 'Desliza'}
			</div>

			{/* Content Container */}
			<div 
				className="absolute flex flex-col z-20"
				style={{
					top: layout.top,
					bottom: (imageUrl && !isOutro) ? 150 : layout.bottom,
					left: layout.side,
					right: layout.side,
					opacity
				}}
			>
				{/* Header (Always visible) */}
				{config.show_hashtag !== false && (
					<div className={`flex items-center gap-4 mb-10 ${layout.headerJustify}`}>
						<Hash size={50} color={accentColor} />
						<span className="text-5xl font-bold tracking-tight opacity-70">
							{config.hashtag || 'carousel'}
						</span>
					</div>
				)}

				{/* Main Content Area */}
				<div 
					className={`flex-1 flex flex-col min-h-0 ${(!imageUrl || isOutro) ? 'justify-center items-center text-center' : ''}`}
					style={{ paddingTop: layout.contentPaddingTop }}
				>
					{/* Title Section */}
					<div
						style={{transform: `translateY(${titleY}px)`}}
						className="w-full mb-8 flex-shrink-0"
					>
						<h1 
							style={{fontSize: layout.titleSize}}
							className="font-black uppercase tracking-tighter leading-[1.05] mb-8"
						>
							<Highlighter text={title} accentColor={accentColor} isTitle />
						</h1>
						
						{displayBody && (
							<p 
								style={{fontSize: layout.bodySize}}
								className="font-bold opacity-80 leading-[1.3] max-w-[90%] mx-auto"
							>
								<Highlighter text={displayBody} accentColor={accentColor} />
							</p>
						)}

						{/* Points List */}
						{points && (
							<ul 
								style={{opacity: listOpacity}}
								className={`mt-4 space-y-4 list-none ${(!imageUrl || isOutro) ? 'text-left inline-block' : ''}`}
							>
								{points.map((point, idx) => (
									<li key={idx} className="flex items-start gap-6">
										<div className="w-6 h-6 rounded-full mt-3 flex-shrink-0" style={{backgroundColor: accentColor}} />
										<span 
											style={{fontSize: layout.bodySize}}
											className="font-semibold opacity-90 leading-[1.2]"
										>
											<Highlighter text={point} accentColor={accentColor} />
										</span>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Image Area (Hidden on Outro to focus on CTA) */}
					{imageUrl && !isOutro && (
						<div
							className="relative w-screen flex-1 min-h-0 rounded-[60px] overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.7)] border border-white/10"
							style={{
								marginLeft: -layout.side,
								marginRight: -layout.side,
								width: `calc(100% + ${layout.side * 2}px)`
							}}
						>
							<Img
								src={imageUrl}
								alt="Slide Content"
								className="w-full h-full"
								style={{
									objectFit: image_style?.fit || 'cover',
									objectPosition: image_style?.position || 'center',
									transform: `scale(${image_style?.zoom || 1})`,
								}}
							/>
						</div>
					)}

					{/* Outro Follow CTA */}
					{isOutro && (
						<div className="mt-20 flex flex-col items-center gap-12">
							{/* Merged Branding & CTA */}
							{config.author && (
								<div className="flex items-center gap-8 mb-4">
									{config.author.avatar && (
										<div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
											<Img src={staticFile(`data/${config.author.avatar}`)} className="w-full h-full object-cover" alt="avatar" />
										</div>
									)}
									<div className="flex flex-col text-left">
										<span className="text-5xl font-black tracking-tight">{config.author.name}</span>
										<span className="text-4xl font-bold opacity-80" style={{color: accentColor}}>{config.author.handle}</span>
									</div>
								</div>
							)}

							<div className="px-16 py-8 rounded-full bg-white text-black text-5xl font-black uppercase tracking-widest shadow-2xl transform hover:scale-105 transition-transform cursor-pointer">
								Sígueme
							</div>
							
							<div className="flex items-center gap-6 text-5xl font-bold opacity-40">
								<span>COMENTA</span>
								<span>•</span>
								<span>COMPARTE</span>
								<span>•</span>
								<span>GUARDA</span>
							</div>
						</div>
					)}
				</div>

				{/* Progress Bar */}
				<div className="w-full pt-8 flex-shrink-0">
					<div
						className="h-2 rounded-full w-full"
						style={{backgroundColor: accentColor, opacity: 0.3}}
					/>
				</div>
			</div>

			{/* Floating CTA (Only on non-outro) */}
			{!isOutro && (
				<div 
					className="absolute bottom-16 right-16 flex items-center gap-6 z-30"
					style={{opacity}}
				>
					<div className="text-4xl font-black opacity-80 uppercase tracking-[0.2em] whitespace-nowrap drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] px-4 py-2">
						Desliza
					</div>
					<div
						className="w-24 h-24 rounded-full flex items-center justify-center border-4 border-white/30 shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
						style={{color: accentColor, backgroundColor: 'rgba(255,255,255,0.1)'}}
					>
						<ArrowRight size={56} strokeWidth={3} />
					</div>
				</div>
			)}

			{/* Debug Safe Zones (Development Only) */}
			{process.env.NODE_ENV === 'development' && config.safe_zone && (
				<div className="absolute inset-0 pointer-events-none" style={{zIndex: 100}}>
					<div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/30" style={{height: layout.top}} />
					<div className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-red-500/30" style={{height: layout.bottom}} />
					<div className="absolute inset-y-0 left-0 bg-red-500/10 border-r border-red-500/30" style={{width: layout.side}} />
					<div className="absolute inset-y-0 right-0 bg-red-500/10 border-l border-red-500/30" style={{width: layout.side}} />
				</div>
			)}
		</AbsoluteFill>
	);
};



