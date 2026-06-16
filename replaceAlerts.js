const fs = require('fs');
const path = require('path');

const directoryPath = path.join('c:', 'al aws done', 'moo_project', 'src');

const replaceAlerts = (dir) => {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceAlerts(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('alert(')) {
                // We use a regex to match alert(something)
                // Need to be careful with nested parentheses. 
                // A simple string replace since there are only 13 instances.
                content = content.replace(/alert\((['"])(.*?)\1\)/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \\\, type: 'error' } }))");
                content = content.replace(/alert\((msg)\)/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: \, type: 'error' } }))");
                content = content.replace(/alert\('—’Ìœ «·ÿ«·» €Ì— ﬂ«›. «·—’Ìœ «·Õ«·Ì: ' \+ studentBalance.toFixed\(2\) \+ ' —.”'\)/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: '—’Ìœ «·ÿ«·» €Ì— ﬂ«›. «·—’Ìœ «·Õ«·Ì: ' + studentBalance.toFixed(2) + ' —.”', type: 'error' } }))");
                content = content.replace(/alert\('ÕœÀ Œÿ√ √À‰«¡  Õ„Ì· «·»Ì«‰« : ' \+ \(err.message \|\| err\)\)/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'ÕœÀ Œÿ√ √À‰«¡  Õ„Ì· «·»Ì«‰« : ' + (err.message || err), type: 'error' } }))");
                content = content.replace(/alert\('ÕœÀ Œÿ√ √À‰«¡ ≈‰‘«¡ «·‹ PDF: ' \+ \(err.message \|\| err\)\)/g, "window.dispatchEvent(new CustomEvent('moo-toast', { detail: { message: 'ÕœÀ Œÿ√ √À‰«¡ ≈‰‘«¡ «·‹ PDF: ' + (err.message || err), type: 'error' } }))");
                
                // For success alerts, let's try to infer from text
                content = content.replace(/type: 'error' } \)\)/g, (match, offset, str) => {
                    const snippet = str.substring(offset - 60, offset);
                    if (snippet.includes('»‰Ã«Õ') || snippet.includes(' „ Õ›Ÿ')) {
                        return "type: 'success' } ))";
                    }
                    return match;
                });

                fs.writeFileSync(fullPath, content, 'utf8');
                console.log('Replaced alerts in: ' + fullPath);
            }
        }
    });
};

replaceAlerts(directoryPath);
