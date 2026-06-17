const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/**/*.jsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const target = /window\.dispatchEvent\(new Event\('storage'\)\); window\.dispatchEvent\(new CustomEvent\('moo-sync'\)\);/g;
  
  if (target.test(content)) {
    content = content.replace(target, '');
    fs.writeFileSync(file, content);
    console.log(`Reverted in ${file}`);
  }
});
