import {bundle} from '@remotion/bundler';
import {renderStill, renderMedia, getCompositions} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import {jsPDF} from 'jspdf';
import {enableTailwind} from '@remotion/tailwind-v4';
import {calculateSlideDuration} from '../src/utils/duration';

const render = async () => {
	const args = process.argv.slice(2);
	const scriptArg = args.find(a => a.startsWith('--script='));
	const scriptFile = scriptArg ? scriptArg.split('=')[1] : 'public/data/script.json';
	const scriptPath = path.resolve(scriptFile);
	
	if (!fs.existsSync(scriptPath)) {
		console.error(`Script not found: ${scriptPath}`);
		process.exit(1);
	}

	const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
	const projectName = script.project_name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'default';
	
	const runAll = args.length === 0 || args.every(a => a.startsWith('--script') || a.startsWith('--format') || a.startsWith('--scale'));
	const runStills = runAll || args.includes('--stills');
	const runPdf = runAll || args.includes('--pdf');
	const runVideo = runAll || args.includes('--video');

	// Aspect Ratio and Scale Parsing
	const formatArg = args.find(a => a.startsWith('--format='));
	const format = formatArg ? formatArg.split('=')[1] : '9:16'; // Default 9:16
	
	const scaleArg = args.find(a => a.startsWith('--scale='));
	const scale = scaleArg ? parseFloat(scaleArg.split('=')[1]) : 1;

	const getDimensions = (fmt: string) => {
		const baseWidth = 1080;
		const baseHeight = fmt === '4:5' ? 1350 : 1920;
		return {
			width: Math.round(baseWidth * scale),
			height: Math.round(baseHeight * scale)
		};
	};

	const getCompId = (fmt: string) => `Carousel-${fmt.replace(':', '-')}`;
	const getOutDir = (fmt: string) => path.resolve('out', projectName, fmt.replace(':', '-'));

	console.log(`Starting render for project: ${projectName} (scale: ${scale})...`);

	console.log('Bundling project...');
	const bundleLocation = await bundle({
		entryPoint: path.resolve('src/index.ts'),
		webpackOverride: enableTailwind,
	});

	const renderStillsInternal = async (fmt: string) => {
		const { width, height } = getDimensions(fmt);
		const outDir = getOutDir(fmt);
		const stillsDir = path.join(outDir, 'stills');
		
		if (!fs.existsSync(stillsDir)) fs.mkdirSync(stillsDir, { recursive: true });
		
		console.log(`Rendering stills for ${fmt} (${width}x${height})...`);
		for (let i = 0; i < script.slides.length; i++) {
			const outputPath = path.join(stillsDir, `slide-${i + 1}.png`);
			console.log(`Rendering slide ${i + 1}...`);
			
			const comps = await getCompositions(bundleLocation, {
				inputProps: { 
					slide: script.slides[i],
					config: script.config,
					width,
					height
				}
			});
			const comp = comps.find((c) => c.id === 'SlideStill')!;

			await renderStill({
				composition: comp,
				serveUrl: bundleLocation,
				output: outputPath,
				frame: 40,
				inputProps: { 
					slide: script.slides[i],
					config: script.config,
					width,
					height
				},
			});
		}
	};

	// 1. Render Stills
	if (runStills) {
		const stillsFormat = args.find(a => a.startsWith('--stills-format='))?.split('=')[1] || format;
		await renderStillsInternal(stillsFormat);
	}

	// 2. Generate PDF
	if (runPdf) {
		const pdfFormat = args.find(a => a.startsWith('--pdf-format='))?.split('=')[1] || format;
		const { width, height } = getDimensions(pdfFormat);
		const outDir = getOutDir(pdfFormat);
		const stillsDir = path.join(outDir, 'stills');
		
		// Auto-render stills if missing
		if (!fs.existsSync(stillsDir) || fs.readdirSync(stillsDir).length < script.slides.length) {
			console.log(`Stills for ${pdfFormat} missing. Generating them automatically...`);
			await renderStillsInternal(pdfFormat);
		}

		console.log(`Generating PDF for ${pdfFormat} (${width}x${height})...`);
		
		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'px',
			format: [width, height],
		});

		for (let i = 0; i < script.slides.length; i++) {
			const imgPath = path.join(stillsDir, `slide-${i + 1}.png`);
			if (!fs.existsSync(imgPath)) {
				console.error(`ERROR: Failed to find or generate image for PDF: ${imgPath}`);
				process.exit(1);
			}
			if (i > 0) pdf.addPage([width, height], 'portrait');
			const imgData = fs.readFileSync(imgPath).toString('base64');
			pdf.addImage(imgData, 'PNG', 0, 0, width, height);
		}
		const pdfPath = path.join(outDir, 'carousel.pdf');
		pdf.save(pdfPath);
		console.log(`PDF generated at ${pdfPath}`);
	}

	// 3. Render Video
	if (runVideo) {
		const videoFormat = args.find(a => a.startsWith('--video-format='))?.split('=')[1] || format;
		const { width, height } = getDimensions(videoFormat);
		const outDir = getOutDir(videoFormat);
		const videoCompId = getCompId(videoFormat);
		const videoPath = path.join(outDir, 'video.mp4');
		
		if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

		console.log(`Rendering video for ${videoFormat} (${width}x${height})...`);
		
		const videoComps = await getCompositions(bundleLocation, {
			inputProps: { 
				slides: script.slides,
				config: script.config,
				width,
				height
			}
		});
		const videoComp = videoComps.find((c) => c.id === videoCompId);
		if (!videoComp) {
			console.error(`Composition ${videoCompId} not found!`);
			process.exit(1);
		}
		
		videoComp.durationInFrames = script.slides.reduce((acc: number, s: any) => acc + calculateSlideDuration(s), 0);

		await renderMedia({
			composition: videoComp,
			serveUrl: bundleLocation,
			outputLocation: videoPath,
			inputProps: { 
				slides: script.slides,
				config: script.config,
				width,
				height
			},
			codec: 'h264',
		});
		console.log(`Video generated at ${videoPath}`);
	}

	console.log('Done!');
};

render().catch((err) => {
	console.error(err);
	process.exit(1);
});

