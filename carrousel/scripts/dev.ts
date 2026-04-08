import { execSync } from 'child_process';

const dev = async () => {
    const args = process.argv.slice(2);
    const positionalArg = args.find(a => !a.startsWith('-'));
    const projectArg = args.find(a => a.startsWith('--project='));
    
    const projectFolder = projectArg ? projectArg.split('=')[1] : positionalArg;

    if (!projectFolder) {
        console.error("ERROR: You must specify a project folder name.");
        process.exit(1);
    }

    console.log(`Starting dev preview for project: ${projectFolder}...`);

    try {
        // We pass the project folder via an Environment Variable
        // Remotion automatically makes REMOTION_ prefixed vars available in the browser!
        execSync(`npx remotion studio --props=public/data/${projectFolder}/script.json`, { 
            stdio: 'inherit',
            env: {
                ...process.env,
                REMOTION_PROJECT_FOLDER: projectFolder
            }
        });
    } catch (e) {
        // Ignore exit codes
    }
};

dev().catch(console.error);
