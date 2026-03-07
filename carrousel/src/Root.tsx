import {Composition, Series} from 'remotion';
import {Slide, SlideProps} from './Slide';
import './index.css';

// Default script for development if no inputProps are provided
const defaultScript = {
	project_name: 'NotebookLM Carousel',
	slides: [
		{
			type: 'intro',
			title: 'NotebookLM ¿Y si pudieras CHATEAR con tus PDFs?',
			body: 'Deja de leer. Empieza a preguntar.',
			image: 'https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=1080&q=80',
			background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
		},
		{
			type: 'body',
			title: 'Sube tus documentos',
			body: 'Acepta PDFs, archivos de texto y pegado de contenido web.',
			image: 'https://images.unsplash.com/photo-1544391496-1ca7c974557e?auto=format&fit=crop&w=1080&q=80',
			background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
		},
		{
			type: 'body',
			title: 'Preguntas Inteligentes',
			body: 'El modelo entiende el contexto de TUS archivos.',
			image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1080&q=80',
			background: 'linear-gradient(135deg, #000 0%, #1a1a1a 100%)',
		},
		{
			type: 'body',
			title: 'Notas Dinámicas',
			body: 'Organiza tus hallazgos automáticamente.',
			image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1080&q=80',
			background: 'linear-gradient(135deg, #1a1a1a 0%, #000 100%)',
		},
		{
			type: 'cta',
			title: 'Pruébalo ahora gratis',
			body: 'Dale una vida nueva a tus documentos.',
			image: 'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?auto=format&fit=crop&w=1080&q=80',
			background: 'linear-gradient(135deg, #000 0%, #333 100%)',
		},
	],
};

export const RemotionRoot: React.FC = () => {
	// 30 fps * 5 seconds * 5 slides = 750 frames
	return (
		<>
			<Composition
				id="CarouselVideo"
				component={CarouselVideo}
				durationInFrames={750}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={defaultScript}
			/>

			<Composition
				id="SlideStill"
				component={SlideStillWrapper}
				durationInFrames={30}
				fps={30}
				width={1080}
				height={1920}
				defaultProps={{
					slide: defaultScript.slides[0],
				}}
			/>
		</>
	);
};

const SlideStillWrapper: React.FC<{slide: SlideProps}> = ({slide}) => {
	return <Slide {...slide} />;
};

const CarouselVideo: React.FC<{slides: SlideProps[]}> = ({slides}) => {
	return (
		<div className="bg-black w-full h-full">
			<Series>
				{slides.map((slide, index) => (
					<Series.Sequence key={index} durationInFrames={150}>
						<Slide {...slide} />
					</Series.Sequence>
				))}
			</Series>
		</div>
	);
};

