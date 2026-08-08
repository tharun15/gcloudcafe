const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  const content = fs.readFileSync('/home/thara/documents/projects/tharun15/README.md', 'utf8');
  const b64 = Buffer.from(content).toString('base64');
  fs.writeFileSync('/tmp/b64.txt', b64);

  try {
    const output = execSync('gh api -X PUT repos/tharun15/tharun15/contents/README.md -f message="feat: create grounded profile README" -F content=@/tmp/b64.txt', { encoding: 'utf8' });
    console.log('🎉 GitHub Profile README Published Successfully!');
    console.log(output);
  } catch (err) {
    console.error('Error pushing profile README:', err.stderr || err.message);
  }
}

main();
