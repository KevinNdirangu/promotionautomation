const fs = require('fs');
let content = fs.readFileSync('src/nominal-roll.html', 'utf8');

// Replace the first modal box style
content = content.replace(
  /<div class="modal-box" style="max-width: 720px;">/g,
  '<div class="modal-box" style="max-width: 720px; max-height: 88vh; display: flex; flex-direction: column;">'
);

// Replace grid style
content = content.replace(
  /grid-template-columns: repeat\(auto-fit, minmax\(190px, 1fr\)\); gap: 10px;"/g,
  'grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 10px; overflow-y: auto; max-height: 52vh; padding-right: 5px;"'
);

fs.writeFileSync('src/nominal-roll.html', content);
