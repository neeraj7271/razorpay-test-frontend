// This script removes Material UI traces from the project
const fs = require('fs');
const path = require('path');

// Check if node_modules/@mui exists and remove it
const muiPath = path.join(__dirname, 'node_modules', '@mui');
if (fs.existsSync(muiPath)) {
    console.log('Removing @mui from node_modules...');
    fs.rmSync(muiPath, { recursive: true, force: true });
}

// Find Material UI entries in package-lock.json and clean them
const packageLockPath = path.join(__dirname, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
    console.log('Cleaning package-lock.json...');

    try {
        const packageLock = require(packageLockPath);

        // Remove any @mui dependencies from package-lock
        if (packageLock.dependencies) {
            Object.keys(packageLock.dependencies).forEach(dep => {
                if (dep.startsWith('@mui/')) {
                    delete packageLock.dependencies[dep];
                }
            });
        }

        // Write back the cleaned package-lock
        fs.writeFileSync(packageLockPath, JSON.stringify(packageLock, null, 2));
    } catch (error) {
        console.error('Error processing package-lock.json:', error);
    }
}

console.log('Cleanup complete!'); 