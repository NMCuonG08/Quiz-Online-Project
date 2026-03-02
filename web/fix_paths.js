const fs = require('fs');
const path = require('path');

function replaceInFolder(folder, rawReplacements) {
    const files = fs.readdirSync(folder);
    for (const file of files) {
        const fullPath = path.join(folder, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFolder(fullPath, rawReplacements);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            for (const [search, replace] of rawReplacements) {
                if (content.includes(search)) {
                    content = content.split(search).join(replace);
                    changed = true;
                }
            }
            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log('Updated', fullPath);
            }
        }
    }
}

// Fix various router push paths and redundant strings
const pathReplacements = [
    ['/client/user-quizzes', '/user/quizzes'],
    ['/client/user-questions', '/user/quizzes/questions'], // Questions are usually under quiz id
];

replaceInFolder('e:\\Project\\Quiz-Online-Project\\web\\src\\modules\\client\\user-quizzes', pathReplacements);
replaceInFolder('e:\\Project\\Quiz-Online-Project\\web\\src\\modules\\client\\user-questions', pathReplacements);
replaceInFolder('e:\\Project\\Quiz-Online-Project\\web\\app\\[locale]\\user\\quizzes', pathReplacements);

console.log('Path replacement complete');
