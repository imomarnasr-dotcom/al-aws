const fs = require('fs');
const path = require('path');

function getActualCasePath(filepath) {
    const dir = path.dirname(filepath);
    const base = path.basename(filepath);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (file.toLowerCase() === base.toLowerCase()) {
            return path.join(dir, file);
        }
    }
    return null;
}

function checkDirectory(dir) {
    const files = fs.readdirSync(dir);
    let foundMismatch = false;

    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (checkDirectory(fullPath)) foundMismatch = true;
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const importRegex = /(?:import|export)\s+(?:.*?from\s+)?['"]([^'"]+)['"]/g;
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                const importPath = match[1];
                if (importPath.startsWith('.')) {
                    let resolvedPath = path.resolve(dir, importPath);
                    if (!path.extname(resolvedPath)) {
                        if (fs.existsSync(resolvedPath + '.jsx')) resolvedPath += '.jsx';
                        else if (fs.existsSync(resolvedPath + '.js')) resolvedPath += '.js';
                        else if (fs.existsSync(resolvedPath + '/index.jsx')) resolvedPath += '/index.jsx';
                        else if (fs.existsSync(resolvedPath + '/index.js')) resolvedPath += '/index.js';
                    }
                    
                    if (fs.existsSync(resolvedPath)) {
                        const actualPath = getActualCasePath(resolvedPath);
                        if (actualPath && path.basename(actualPath) !== path.basename(resolvedPath)) {
                            console.log(`Mismatch in ${fullPath}:`);
                            console.log(`  Imported as: ${path.basename(resolvedPath)}`);
                            console.log(`  Actual file: ${path.basename(actualPath)}`);
                            foundMismatch = true;
                        }
                    } else {
                        // Check if it exists with different case
                        const parentDir = path.dirname(resolvedPath);
                        if (fs.existsSync(parentDir)) {
                            const actualMatch = getActualCasePath(resolvedPath);
                            if (actualMatch) {
                                console.log(`Mismatch in ${fullPath}:`);
                                console.log(`  Imported as: ${path.basename(resolvedPath)}`);
                                console.log(`  Actual file: ${path.basename(actualMatch)}`);
                                foundMismatch = true;
                            }
                        }
                    }
                }
            }
        }
    }
    return foundMismatch;
}

const hasMismatch = checkDirectory(path.join(__dirname, 'src'));
if (!hasMismatch) console.log("No case mismatches found in src!");
