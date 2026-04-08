import {bundle} from '@remotion/bundler';
import {renderStill, renderMedia, getCompositions} from '@remotion/renderer';
import path from 'path';
import fs from 'fs';
import {jsPDF} from 'jspdf';
import {enableTailwind} from '@remotion/tailwind-v4';
import {calculateSlideDuration} from '../src/utils/duration';

const renderProject = async (scriptPath: string) => {
	if (!fs.existsSync(scriptPath)) {
		console.error(`Script not found: ${scriptPath}`);
		return;
	}

	const args = process.argv.slice(2);
	const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
	const folderName = path.basename(path.dirname(scriptPath));
	const projectName = folderName !== 'data' && folderName !== 'public' && folderName !== '.' ? folderName : (script.project_name?.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') || 'default');
	
	// Inject folder name for asset resolution
	if (!script.config) script.config = {};
	script.config.projectFolder = folderName;
	
	const formatArg = args.find(a => a.startsWith('--format='));
	const formatStr = formatArg ? formatArg.split('=')[1] : '9:16';
	const baseFormats = formatStr === 'all' ? ['9:16', '4:5'] : [formatStr];

	const parseFormats = (argPrefix: string) => {
		const arg = args.find(a => a.startsWith(argPrefix));
		if (!arg) return baseFormats;
		const val = arg.split('=')[1];
		return val === 'all' ? ['9:16', '4:5'] : [val];
	};

	const stillsFormats = parseFormats('--stills-format=');
	const pdfFormats = parseFormats('--pdf-format=');
	const videoFormats = parseFormats('--video-format=');

	const hasSpecificAction = args.some(a => ['--stills', '--pdf', '--video'].includes(a) || a.startsWith('--stills-format=') || a.startsWith('--pdf-format=') || a.startsWith('--video-format='));
	const runStills = !hasSpecificAction || args.includes('--stills') || args.some(a => a.startsWith('--stills-format='));
	const runPdf = !hasSpecificAction || args.includes('--pdf') || args.some(a => a.startsWith('--pdf-format='));
	const runVideo = !hasSpecificAction || args.includes('--video') || args.some(a => a.startsWith('--video-format='));
	
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
		for (const fmt of stillsFormats) {
			await renderStillsInternal(fmt);
		}
	}

	// 2. Generate PDF
	if (runPdf) {
		for (const fmt of pdfFormats) {
			const { width, height } = getDimensions(fmt);
			const outDir = getOutDir(fmt);
			const stillsDir = path.join(outDir, 'stills');
			
			// Auto-render stills if missing
			if (!fs.existsSync(stillsDir) || fs.readdirSync(stillsDir).length < script.slides.length) {
				console.log(`Stills for ${fmt} missing. Generating them automatically...`);
				await renderStillsInternal(fmt);
			}

			console.log(`Generating PDF for ${fmt} (${width}x${height})...`);
			
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
	}

	// 3. Render Video
	if (runVideo) {
		for (const fmt of videoFormats) {
			const { width, height } = getDimensions(fmt);
			const outDir = getOutDir(fmt);
			const videoCompId = getCompId(fmt);
			const videoPath = path.join(outDir, 'video.mp4');
			
			if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

			console.log(`Rendering video for ${fmt} (${width}x${height})...`);
			
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
	}

	console.log(`Done with project: ${projectName}!`);
};

const main = async () => {
    const args = process.argv.slice(2);
    const projectArg = args.find(a => a.startsWith('--project='));
    const projectValues = projectArg ? projectArg.split('=')[1] : null;

    if (!projectValues) {
        console.error("ERROR: You must specify a mandatory project folder name using --project.");
        console.error("Example: npm run render -- --project=git_basics");
        console.error("Example: npm run render -- --project=git_basics,judit");
        console.error("Example: npm run render -- --project=all");
        process.exit(1);
    }

    if (projectValues === 'all') {
        const dataDir = path.resolve('public/data');
        const folders = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)).isDirectory());
        for (const folder of folders) {
            await renderProject(path.join(dataDir, folder, 'script.json'));
        }
    } else {
        const projects = projectValues.split(',').map(p => p.trim());
        for (const projectFolder of projects) {
            await renderProject(path.resolve(`public/data/${projectFolder}/script.json`));
        }
    }
};

main().catch((err) => {
	console.error(err);
	process.exit(1);
});

