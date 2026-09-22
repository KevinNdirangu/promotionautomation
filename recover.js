const fs = require('fs');
const readline = require('readline');

async function recover() {
    const fileStream = fs.createReadStream('C:/Users/Ndirangu/.gemini/antigravity/brain/46dc3b1e-c70c-4bb3-af0d-54ea02df85ff/.system_generated/logs/transcript_full.jsonl');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    const recoveredLines = [];
    
    for await (const line of rl) {
        try {
            const data = JSON.parse(line);
            if (data.type === 'GENERIC' && data.content && data.content.includes('dashboard.html')) {
                // If this is a response from view_file
                const lines = data.content.split('\n');
                let inContent = false;
                for (let i = 0; i < lines.length; i++) {
                    const l = lines[i];
                    if (l.match(/^\d+:/)) {
                        const match = l.match(/^(\d+): (.*)$/);
                        if (match) {
                            const lineNo = parseInt(match[1], 10);
                            const text = match[2];
                            recoveredLines[lineNo] = text;
                        }
                    }
                }
            }
        } catch (e) {}
    }

    let out = '';
    for (let i = 1; i < recoveredLines.length; i++) {
        if (recoveredLines[i] !== undefined) {
            out += recoveredLines[i] + '\n';
        } else {
            console.log('Missing line:', i);
            out += '\n'; // fallback
        }
    }
    
    fs.writeFileSync('src/dashboard.html.recovered', out);
    console.log('Recovered lines:', recoveredLines.filter(x => x).length);
    console.log('Max line:', recoveredLines.length - 1);
}

recover();
