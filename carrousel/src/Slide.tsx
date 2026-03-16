import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, staticFile, Img, useVideoConfig} from 'remotion';
import {ArrowRight, Hash} from 'lucide-react';

export interface SlideProps {
	title: string;
	body?: string;
	sub?: string;
	points?: string[];
	image?: string;
	image_style?: {
		zoom?: number;
		fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
		position?: string;
		width?: string;
		height?: string;
		borderRadius?: string;
	};
	image_style_4_5?: {
		zoom?: number;
		fit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
		position?: string;
		width?: string;
		height?: string;
		borderRadius?: string;
	};
	duration?: number;
	background?: string;
	color?: string; // Individual slide theme color
	isStatic?: boolean; // If true, bypass animations
	layout?: 'standard' | 'title_only' | 'blank' | 'full_image' | 'code' | 'intro' | 'outro' | 'image_top';
	src?: string;
	title_offset_x?: number;
	title_offset_y?: number;
	body_offset_x?: number;
	body_offset_y?: number;
	config: {
		theme?: string;
		background?: string;
		accent_color?: string;
		primary_color?: string;
		highlight_bg_color?: string;
		highlight_text_color?: string;
		hashtag?: string;
		show_hashtag?: boolean;
		safe_zone?: 'tiktok' | 'stories' | 'none';
		thumbnail_mode?: 'none' | 'freeze' | 'static';
		font_size_title?: number;
		font_size_body?: number;
		font_size_title_4_5?: number;
		font_size_body_4_5?: number;
		author?: {
			name: string;
			handle: string;
			avatar?: string;
		};
	};
}

const Highlighter: React.FC<{
	text: string; 
	accentColor: string; 
	primaryColor: string;
	highlightBgColor?: string;
	highlightTextColor?: string;
	isTitle?: boolean;
}> = ({text, accentColor, primaryColor, highlightBgColor, highlightTextColor, isTitle}) => {
	return (
		<>
			{text.split(' ').map((word, i) => {
				const isBlockHighlight = word.startsWith('%');
				const isAccentHighlight = word.startsWith('@');
				const cleanWord = word.replace(/[%@]/g, '');

				if (isBlockHighlight) {
					return (
						<React.Fragment key={i}>
							<span 
								style={{
									backgroundColor: highlightBgColor || accentColor,
									color: highlightTextColor || primaryColor
								}}
								className={`${isTitle ? 'px-6 py-2' : 'px-3 py-1'} inline-block`}
							>
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
	image_style_4_5,
	background,
	color,
	isStatic = false,
	layout = 'standard',
	title_offset_x = 0,
	title_offset_y = 0,
	body_offset_x = 0,
	body_offset_y = 0,
	config,
}) => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	const isOutro = layout === 'outro';

	const aspectRatio = width / height;
	const isVertical = aspectRatio < 0.7; // ~9:16 is 0.56, 4:5 is 0.8

	const imageUrl = image && !image.startsWith('http') ? staticFile(`data/${image}`) : image;
	const selectedStyle = (!isVertical && image_style_4_5) ? image_style_4_5 : image_style;

	// Layout Centralization - Dynamic based on height/width
	const layoutConfig = {
		top: isVertical ? height * 0.14 : height * 0.1, // Reduced for 4:5
		side: isVertical ? width * 0.09 : width * 0.06, // Reduced for 4:5
		// Outro slides bypass safe zones for impact, content slides respect them (TikTok/Stories)
		bottom: isOutro 
			? height * 0.05 
			: isVertical 
				? (config.safe_zone === 'tiktok' ? 670 : (config.safe_zone === 'stories' ? 380 : (config.safe_zone === 'none' ? 80 : 150)))
				: 80, // Even tighter bottom for 4:5 to maximize space
		// Dynamic Font Sizes (Scale with width)
		titleSize: (!isVertical && config.font_size_title_4_5) 
			? config.font_size_title_4_5 
			: config.font_size_title || (isOutro ? width * 0.12 : (imageUrl ? width * (isVertical ? 0.075 : 0.07) : width * 0.1)),
		bodySize: (!isVertical && config.font_size_body_4_5)
			? config.font_size_body_4_5
			: config.font_size_body || (isOutro ? width * 0.075 : (imageUrl ? width * (isVertical ? 0.055 : 0.05) : width * 0.075)),
		// Spacing adjustments
		contentPaddingTop: isOutro ? height * 0.1 : 0,
		headerJustify: (!imageUrl || isOutro) ? 'justify-center' : 'justify-start',
		headerMarginBottom: isVertical ? 40 : 16, // Reduced for 4:5
	};

	const accentColor = color || config.accent_color || '#00ff88';
	const primaryColor = config.primary_color || '#ffffff';
	const bg = background || config.background || 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)';
	const displayBody = body || sub;

	// Animations - Bypassed if isStatic is true
	const opacity = isStatic ? 1 : interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
	const titleY = isStatic ? 0 : interpolate(frame, [5, 20], [50, 0], {extrapolateRight: 'clamp'});
	const listOpacity = isStatic ? 1 : interpolate(frame, [20, 35], [0, 1], {extrapolateRight: 'clamp'});

	if (layout === 'blank') {
		const bg = background || config.background || 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)';
		return (
			<AbsoluteFill style={{background: bg, overflow: 'hidden'}} />
		);
	}

	return (
		<AbsoluteFill style={{background: bg, color: primaryColor, fontFamily: 'Inter, sans-serif', overflow: 'hidden'}}>
			{/* Big background watermark */}
			<div 
				className="absolute -bottom-20 -right-20 text-[350px] font-black opacity-10 uppercase tracking-tighter pointer-events-none select-none z-0"
				style={{ color: accentColor, lineHeight: 0.8 }}
			>
				{isOutro ? 'Fin' : 'Desliza'}
			</div>

			{/* Full Image Layout Background (ignores safe zones) */}
			{layout === 'full_image' && imageUrl && (
				<div className="absolute inset-0 z-0">
					<Img
						src={imageUrl}
						alt="Background Slide Content"
						className="w-full h-full"
						style={{
							objectFit: selectedStyle?.fit || 'cover',
							objectPosition: selectedStyle?.position || 'center',
							transform: `scale(${selectedStyle?.zoom || 1})`,
							opacity: 0.6 // darken slightly for text readability
						}}
					/>
					<div className="absolute inset-0 bg-black/40" /> {/* Overlay */}
				</div>
			)}

			{/* Content Container */}
			<div 
				className="absolute flex flex-col z-20"
				style={{
					top: layoutConfig.top,
					bottom: (imageUrl && !isOutro) ? 150 : layoutConfig.bottom,
					left: layoutConfig.side,
					right: layoutConfig.side,
					opacity
				}}
			>
				{/* Header (Always visible) */}
				{config.show_hashtag !== false && (
					<div 
						className={`flex items-center gap-4 ${layoutConfig.headerJustify}`}
						style={{ marginBottom: layoutConfig.headerMarginBottom }}
					>
						<Hash size={50} color={accentColor} />
						<span className="text-5xl font-bold tracking-tight opacity-70">
							{config.hashtag || 'carousel'}
						</span>
					</div>
				)}

				{/* Main Content Area */}
				<div 
					className={`flex-1 flex flex-col min-h-0 ${(!imageUrl || isOutro || layout === 'title_only' || layout === 'full_image') ? 'justify-center items-center text-center' : ''}`}
					style={{ paddingTop: layoutConfig.contentPaddingTop }}
				>
					{/* Title Section (Title Only) */}
					<div
						style={{
							marginTop: (layout === 'image_top' && imageUrl) ? '40px' : '0px',
							transform: `translate(${title_offset_x}px, ${titleY + title_offset_y}px)`
						}}
						className="w-full mb-8 flex-shrink-0"
					>
						<h1 
							style={{fontSize: layoutConfig.titleSize}}
							className="font-black uppercase tracking-tighter leading-[1.05] mb-8"
						>
							<Highlighter 
								text={title} 
								accentColor={accentColor} 
								primaryColor={primaryColor}
								highlightBgColor={config.highlight_bg_color}
								highlightTextColor={config.highlight_text_color}
								isTitle 
							/>
						</h1>
					</div>

					{/* Image Area for image_top (Between Title and Body) */}
					{layout === 'image_top' && imageUrl && !isOutro && (
						<div
							className="relative flex-1 min-h-0 overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.7)] border border-white/10 mb-8"
							style={{
								marginLeft: selectedStyle?.width ? 'auto' : -layoutConfig.side,
								marginRight: selectedStyle?.width ? 'auto' : -layoutConfig.side,
								width: selectedStyle?.width || `calc(100% + ${layoutConfig.side * 2}px)`,
								height: selectedStyle?.height || 'auto',
								borderRadius: selectedStyle?.borderRadius || '60px',
							}}
						>
							<Img
								src={imageUrl}
								alt="Slide Content"
								className="w-full h-full"
								style={{
									objectFit: selectedStyle?.fit || 'cover',
									objectPosition: selectedStyle?.position || 'center',
									transform: `scale(${selectedStyle?.zoom || 1})`,
								}}
							/>
						</div>
					)}

					{/* Body & Points Section */}
					<div
						style={{
							transform: `translate(${title_offset_x}px, ${titleY + title_offset_y}px)`
						}}
						className="w-full mb-8 flex-shrink-0"
					>
						{displayBody && (
							<p 
								style={{
									fontSize: layoutConfig.bodySize,
									transform: `translate(${body_offset_x}px, ${body_offset_y}px)`
								}}
								className="font-bold opacity-80 leading-[1.3] max-w-[90%] mx-auto"
							>
								<Highlighter 
									text={displayBody} 
									accentColor={accentColor} 
									primaryColor={primaryColor}
									highlightBgColor={config.highlight_bg_color}
									highlightTextColor={config.highlight_text_color}
								/>
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
											style={{fontSize: layoutConfig.bodySize}}
											className="font-semibold opacity-90 leading-[1.2]"
										>
											<Highlighter 
												text={point} 
												accentColor={accentColor} 
												primaryColor={primaryColor}
												highlightBgColor={config.highlight_bg_color}
												highlightTextColor={config.highlight_text_color}
											/>
										</span>
									</li>
								))}
							</ul>
						)}
					</div>

					{/* Image Area for standard layouts (Hidden on image_top, Outro, title_only, full_image) */}
					{layout !== 'image_top' && imageUrl && !isOutro && layout !== 'title_only' && layout !== 'full_image' && (
						<div
							className="relative flex-1 min-h-0 overflow-hidden shadow-[0_60px_120px_rgba(0,0,0,0.7)] border border-white/10"
							style={{
								marginLeft: selectedStyle?.width ? 'auto' : -layoutConfig.side,
								marginRight: selectedStyle?.width ? 'auto' : -layoutConfig.side,
								width: selectedStyle?.width || `calc(100% + ${layoutConfig.side * 2}px)`,
								height: selectedStyle?.height || 'auto',
								borderRadius: selectedStyle?.borderRadius || '60px',
							}}
						>
							<Img
								src={imageUrl}
								alt="Slide Content"
								className="w-full h-full"
								style={{
									objectFit: selectedStyle?.fit || 'cover',
									objectPosition: selectedStyle?.position || 'center',
									transform: `scale(${selectedStyle?.zoom || 1})`,
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
			{process.env.NODE_ENV === 'development' && config.safe_zone && config.safe_zone !== 'none' && (
				<div className="absolute inset-0 pointer-events-none" style={{zIndex: 100}}>
					<div className="absolute top-0 left-0 right-0 bg-red-500/10 border-b border-red-500/30" style={{height: layoutConfig.top}} />
					<div className="absolute bottom-0 left-0 right-0 bg-red-500/10 border-t border-red-500/30" style={{height: layoutConfig.bottom}} />
					<div className="absolute inset-y-0 left-0 bg-red-500/10 border-r border-red-500/30" style={{width: layoutConfig.side}} />
					<div className="absolute inset-y-0 right-0 bg-red-500/10 border-l border-red-500/30" style={{width: layoutConfig.side}} />
				</div>
			)}
		</AbsoluteFill>
	);
};



