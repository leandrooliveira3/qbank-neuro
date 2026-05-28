const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, 'pages');

const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
for (const file of files) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('}, [user]);')) {
        content = content.split('}, [user]);').join('}, [user?.id]);');
        fs.writeFileSync(filePath, content);
        console.log('Fixed', file);
    }
}
