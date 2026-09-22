const fs = require('fs');
const recovered = fs.readFileSync('src/dashboard.html.recovered', 'utf8').split('\n');
const missing = fs.readFileSync('missing.html', 'utf8');

const part1 = recovered.slice(0, 800).join('\n');
const part2 = recovered.slice(1179).join('\n'); // 1180 is at index 1179

fs.writeFileSync('src/dashboard.html', part1 + '\n' + missing + '\n' + part2);
console.log('Restored dashboard.html!');
