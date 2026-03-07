import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, staticFile} from 'remotion';
import {ArrowRight, Hash} from 'lucide-react';

export interface SlideProps {
	title: string;
	body: string;
	image?: string;
	background?: string;
	type: 'intro' | 'body' | 'cta';
	accentColor?: string;
}

export const Slide: React.FC<SlideProps> = ({
	title,
	body,
	image,
	background = 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
	type,
	accentColor = '#00ff88',
}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();

	// Animations
	const opacity = interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});
	const titleY = interpolate(frame, [5, 20], [50, 0], {extrapolateRight: 'clamp'});
	const imageScale = interpolate(frame, [10, 30], [0.8, 1], {extrapolateRight: 'clamp'});

	// Handle local image path
	const imageUrl = image && !image.startsWith('http') ? staticFile(`data/${image}`) : image;

	return (
		<AbsoluteFill
			style={{
				background,
				color: 'white',
				fontFamily: 'Inter, sans-serif',
				padding: '80px 60px',
			}}
		>
			<div style={{opacity}} className="flex flex-col h-full relative">
				{/* Header */}
				<div className="flex items-center gap-2 mb-8">
					<Hash size={32} color={accentColor} />
					<span className="text-3xl font-bold tracking-tight opacity-70">
						microguía
					</span>
				</div>

				{/* Title Section */}
				<div
					style={{transform: `translateY(${titleY}px)`}}
					className="mt-12 space-y-6"
				>
					<h1 className="text-8xl font-black uppercase tracking-tighter leading-[0.9]">
						{title.split(' ').map((word, i) => {
							const isHighlighted = word.startsWith('%') || ['CHATEAR', 'NOTEBOOKLM', 'DOCUMENTS', 'AI'].includes(word.toUpperCase().replace(/[¿?]/g, ''));
							return (
								<React.Fragment key={i}>
									<span
										className={
											isHighlighted
												? 'bg-white text-black px-4 py-1 inline-block'
												: ''
										}
									>
										{word.replace('%', '')}
									</span>{' '}
								</React.Fragment>
							);
						})}
					</h1>
					<p className="text-5xl font-bold opacity-80 leading-tight pr-12">
						{body}
					</p>
				</div>

				{/* Image Container */}
				{imageUrl && (
					<div
						style={{
							transform: `scale(${imageScale})`,
							bottom: '300px',
						}}
						className="absolute left-0 right-0 h-[700px] rounded-[40px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.6)] border border-white/10"
					>
						<img
							src={imageUrl}
							alt="Slide Content"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
					</div>
				)}

				{/* Footer */}
				<div className="absolute bottom-10 left-0 right-0 flex justify-between items-center px-4">
					<div
						className="h-1 rounded-full flex-1 mr-8"
						style={{backgroundColor: accentColor, opacity: 0.3}}
					/>
					<div
						className="w-20 h-20 rounded-full flex items-center justify-center border-2 border-white/20"
						style={{color: accentColor}}
					>
						<ArrowRight size={48} />
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

