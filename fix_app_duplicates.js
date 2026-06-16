const fs = require('fs');

const appPath = 'src/App.jsx';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Find the old duplicate block starting point
const duplicateStartIdx = content.indexOf('          <div className="flex-1 flex overflow-hidden">', content.indexOf('</>'));
if (duplicateStartIdx === -1) {
  console.log("Could not find duplicate start");
  process.exit(1);
}

// 2. Find the end of the duplicate block (before </ErrorBoundary>)
const errorBoundaryIdx = content.indexOf('      </ErrorBoundary>', duplicateStartIdx);
if (errorBoundaryIdx === -1) {
  console.log("Could not find ErrorBoundary");
  process.exit(1);
}

// Extract the duplicate chunk
const duplicateChunk = content.substring(duplicateStartIdx, errorBoundaryIdx);

// 3. Extract Academic Store logic from the duplicate chunk
const storeStartMarker = `if (currentPage === 'store') {`;
const storeEndMarker = `} return null; })()}`;

const storeStartIdx = duplicateChunk.indexOf(storeStartMarker);
if (storeStartIdx === -1) {
  console.log("Could not find store logic in duplicate block");
  process.exit(1);
}

let storeLogicChunk = duplicateChunk.substring(
  duplicateChunk.indexOf('const handleBuyItem', storeStartIdx),
  duplicateChunk.lastIndexOf(');', duplicateChunk.indexOf(storeEndMarker)) + 2
);

// Format the store logic properly
storeLogicChunk = `
          {showAcademicStore && (() => {
            ${storeLogicChunk}
          })()}
`;

// 4. Remove the duplicate block from the original content
let newContent = content.substring(0, duplicateStartIdx) + content.substring(errorBoundaryIdx);

// 5. Insert the store logic into the correct place in the NEW block.
// We'll insert it right before the duplicate block used to start
newContent = content.substring(0, duplicateStartIdx) + storeLogicChunk + content.substring(errorBoundaryIdx);

fs.writeFileSync(appPath, newContent);
console.log("Successfully fixed App.jsx by deleting old duplicate and rescuing the Store!");
