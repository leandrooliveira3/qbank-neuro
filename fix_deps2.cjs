const fs = require('fs');
const path = require('path');
const pagesDir = path.join(__dirname, 'pages');

const filesToFix = ['CreateSimulation.tsx', 'tools/BureaucracyTool.tsx', 'ImportQuestions.tsx', 'StudyFlashcards.tsx', 'Summaries.tsx', 'Practice.tsx', 'Videos.tsx'];

for (const file of filesToFix) {
    const filePath = path.join(pagesDir, file);
    if (!fs.existsSync(filePath)) continue;
    let content = fs.readFileSync(filePath, 'utf8');
    
    content = content.replace(/ \], \[user, /g, ' ], [user?.id, ');
    content = content.replace(/ \], \[([^,]+), user\]\);/g, ' ], [$1, user?.id]);');
    content = content.replace(/ \[user, selectedBank\]/g, ' [user?.id, selectedBank]');
    content = content.replace(/ \], \[user\]\);/g, ' ], [user?.id]);');
    content = content.replace(/ \[user\]\);/g, ' [user?.id]);');
    content = content.replace(/ \[isProcessing, results\.length, user\]/g, ' [isProcessing, results.length, user?.id]');
    content = content.replace(/ \[user, studyMode\]/g, ' [user?.id, studyMode]');
    content = content.replace(/ \[user, activeTab\]/g, ' [user?.id, activeTab]');
    content = content.replace(/ \[selectedBanks, selectedTopics, selectedDifficulty, practiceMode, user\]/g, ' [selectedBanks, selectedTopics, selectedDifficulty, practiceMode, user?.id]');
    content = content.replace(/ \[activeVideo, watchTime, user\]/g, ' [activeVideo, watchTime, user?.id]');

    fs.writeFileSync(filePath, content);
    console.log('Fixed', file);
}
