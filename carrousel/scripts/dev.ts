import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

const dev = async () => {
    const args = process.argv.slice(2);
    // Find --project= values OR the first positional argument that doesn't start with -
    const projectArg = args.find(a => a.startsWith('--project='));
    const positionalArg = args.find(a => !a.startsWith('-'));
    
    const projectFolder = projectArg ? projectArg.split('=')[1] : positionalArg;

    if (!projectFolder) {
        console.error("ERROR: You must specify a project folder name.");
        console.log("\nUsage Examples:");
        console.log("  npm run dev -- --project=git_basics");
        console.log("  npm run dev git_basics");
        process.exit(1);
    }
    const scriptPath = path.resolve(`public/data/${projectFolder}/script.json`);

    if (!fs.existsSync(scriptPath)) {
        console.error(`Project script not found: ${scriptPath}`);
        process.exit(1);
    }

    console.log(`Starting dev preview for project: ${projectFolder}...`);

    // We use npx remotion studio and pass props as a JSON string
    // This allows us to inject the projectFolder dynamically
    const scriptContent = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
    if (!scriptContent.config) scriptContent.config = {};
    scriptContent.config.projectFolder = projectFolder;

    const propsJson = JSON.stringify(scriptContent);
    // Escape quotes for shell
    const escapedProps = propsJson.replace(/"/g, '\\"');

    try {
        execSync(`npx remotion studio --props="${escapedProps}"`, { stdio: 'inherit' });
    } catch (e) {
        // Ignore exit codes from studio
    }
};

dev().catch(console.error);
