import React from 'react';
import {AbsoluteFill, useCurrentFrame, interpolate} from 'remotion';
import {ArrowRight} from 'lucide-react';
import {SlideProps} from '../Slide';

export const PromoSlide: React.FC<SlideProps> = ({
	title,
	body,
	background,
	config,
	isStatic
}) => {
	const frame = useCurrentFrame();
	const accentColor = config.accent_color || '#00ff88';
	
	// Example custom animation for the promo
	const scale = isStatic ? 1 : interpolate(frame, [0, 20], [0.8, 1], {extrapolateRight: 'clamp'});
	const opacity = isStatic ? 1 : interpolate(frame, [0, 15], [0, 1], {extrapolateRight: 'clamp'});

	return (
		<AbsoluteFill style={{background, overflow: 'hidden'}}>
			<div 
				className="flex flex-col items-center justify-center w-full h-full text-center px-10"
				style={{opacity, transform: `scale(${scale})`}}
			>
				{/* Custom Layout Elements! */}
				<div 
					className="text-[40px] font-black uppercase tracking-widest px-8 py-4 rounded-full mb-12 border-4"
					style={{borderColor: accentColor, color: accentColor}}
				>
					Special Offer
				</div>
				
				<h1 className="text-[120px] font-black uppercase leading-[1.1] mb-8 text-white drop-shadow-2xl">
					{title}
				</h1>
				
				{body && (
					<p className="text-[60px] font-bold text-white/80 max-w-[80%]">
						{body}
					</p>
				)}

				{/* Custom Floating Elements */}
				<div className="absolute bottom-40 flex items-center gap-4 animate-bounce">
					<span className="text-4xl font-bold uppercase text-white/50">Swipe to Claim</span>
					<div 
						className="w-20 h-20 rounded-full flex items-center justify-center"
						style={{backgroundColor: accentColor, color: '#000'}}
					>
						<ArrowRight size={48} strokeWidth={3} />
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};
