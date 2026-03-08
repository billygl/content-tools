import {bundle} from '@remotion/bundler';
import {renderStill, renderMedia, getCompositions} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import {jsPDF} from 'jspdf';
import {enableTailwind} from '@remotion/tailwind-v4';

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
	
	const runAll = args.length === 0 || args.every(a => a.startsWith('--script'));
	const runStills = runAll || args.includes('--stills');
	const runPdf = runAll || args.includes('--pdf');
	const runVideo = runAll || args.includes('--video');

	const outDir = path.resolve('out', projectName);
	if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

	console.log('Bundling project...');
	const bundleLocation = await bundle({
		entryPoint: path.resolve('src/index.ts'),
		webpackOverride: enableTailwind,
	});

	const stillsDir = path.join(outDir, 'stills');
	if (!fs.existsSync(stillsDir)) fs.mkdirSync(stillsDir);

	const getOutputPath = (i: number) => path.join(stillsDir, `slide-${i + 1}.png`);

	// 1. Render Stills
	if (runStills) {
		console.log('Rendering stills...');
		for (let i = 0; i < script.slides.length; i++) {
			const outputPath = getOutputPath(i);
			console.log(`Rendering slide ${i + 1}...`);
			
			const comps = await getCompositions(bundleLocation, {
				inputProps: { 
					slide: script.slides[i],
					config: script.config
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
					config: script.config
				},
			});
		}
	}

	// 2. Generate PDF
	if (runPdf) {
		console.log('Generating PDF...');
		const pdf = new jsPDF({
			orientation: 'portrait',
			unit: 'px',
			format: [1080, 1920],
		});

		for (let i = 0; i < script.slides.length; i++) {
			const imgPath = getOutputPath(i);
			if (!fs.existsSync(imgPath)) {
				console.error(`Missing image for PDF: ${imgPath}. Run with --stills first.`);
				process.exit(1);
			}
			if (i > 0) pdf.addPage([1080, 1920], 'portrait');
			const imgData = fs.readFileSync(imgPath).toString('base64');
			pdf.addImage(imgData, 'PNG', 0, 0, 1080, 1920);
		}
		const pdfPath = path.join(outDir, 'carousel.pdf');
		pdf.save(pdfPath);
		console.log(`PDF generated at ${pdfPath}`);
	}

	// 3. Render Video
	if (runVideo) {
		console.log('Rendering video...');
		const videoPath = path.join(outDir, 'video.mp4');
		
		const videoComps = await getCompositions(bundleLocation, {
			inputProps: { 
				slides: script.slides,
				config: script.config
			}
		});
		const videoComp = videoComps.find((c) => c.id === 'CarouselVideo')!;
		
		// Update duration based on script: 150 frames per slide
		videoComp.durationInFrames = script.slides.length * 150;

		await renderMedia({
			composition: videoComp,
			serveUrl: bundleLocation,
			outputLocation: videoPath,
			inputProps: { 
				slides: script.slides,
				config: script.config
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

