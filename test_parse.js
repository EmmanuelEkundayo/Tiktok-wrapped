const fs = require('fs');
const path = require('path');

const testDataDir = 'c:/Users/Emmanuel/Documents/GitHub/tiktok data/test_data/TikTok';

function testParsing() {
    console.log("Testing Parsing Logic...");

    // 1. Comments
    const commentsPath = path.join(testDataDir, 'Comments', 'Comments.txt');
    if (fs.existsSync(commentsPath)) {
        const content = fs.readFileSync(commentsPath, 'utf8');
        const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
        console.log(`Total Comments found: ${blocks.length}`);
        
        const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
        const emojiCounts = {};
        const dailyComments = {};

        blocks.slice(0, 100).forEach(b => {
             const lines = b.split('\n');
             let dateStr = "";
             let commentStr = "";
             lines.forEach(l => {
                 if (l.trim().startsWith("Date:")) dateStr = l.split(":")[1].trim();
                 if (l.trim().startsWith("Comment:")) commentStr = l.split(":")[1].trim();
             });
             // Log first block for debugging
             if (blocks.indexOf(b) === 0) {
                 console.log("First block:", b);
                 console.log("Extracted Date:", dateStr);
                 console.log("Extracted Comment:", commentStr);
             }
        });
    } else {
        console.log("Comments.txt not found at", commentsPath);
    }

    // 2. Likes
    const likesPath = path.join(testDataDir, 'Likes and Favourites', 'Like List.txt');
    if (fs.existsSync(likesPath)) {
        const content = fs.readFileSync(likesPath, 'utf8');
        const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
        console.log(`Total Likes found: ${blocks.length}`);
    }

    // 3. Following
    const followingPath = path.join(testDataDir, 'Profile and Settings', 'Following.txt');
    if (fs.existsSync(followingPath)) {
        const content = fs.readFileSync(followingPath, 'utf8');
        const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
        console.log(`Total Following found: ${blocks.length}`);
    }
}

testParsing();
