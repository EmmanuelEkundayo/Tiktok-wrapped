const fs = require('fs');
const path = require('path');

const tiktokDataDir = 'c:/Users/Emmanuel/Documents/Downloads/TikTok_Data_1773002972/TikTok';
const outputDataFile = path.join(__dirname, 'data.js');

// Helper to read and split file into blocks separated by blank lines
function readBlocks(filePath) {
    if (!fs.existsSync(filePath)) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    // Normalize newlines
    let normalized = content.replace(/\r\n/g, '\n');
    return normalized.split(/\n\s*\n/).filter(b => b.trim() !== '');
}

function parseBlocks(blocks) {
    return blocks.map(block => {
        const lines = block.split('\n');
        const obj = {};
        lines.forEach(line => {
            const index = line.indexOf(':');
            if (index > -1) {
                const key = line.substring(0, index).trim();
                const value = line.substring(index + 1).trim();
                obj[key] = value;
            }
        });
        return obj;
    });
}

// Regex to match emojis
const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

// Helper to track yearly counts
function incrementYearly(yearlyData, dateStr, category) {
    if (!dateStr) return;
    const year = new Date(dateStr).getFullYear();
    if (isNaN(year)) return;
    if (!yearlyData[year]) yearlyData[year] = { likes: 0, comments: 0, reposts: 0, watches: 0, follows: 0 };
    yearlyData[year][category]++;
}

function incrementDaily(dailyData, dateStr) {
    if (!dateStr) return;
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return;
        const dateKey = d.toISOString().split('T')[0];
        dailyData[dateKey] = (dailyData[dateKey] || 0) + 1;
    } catch (e) { }
}

function getBusiestDay(dailyData) {
    let max = 0;
    let busyDay = null;
    for (const [day, count] of Object.entries(dailyData)) {
        if (count > max) {
            max = count;
            busyDay = day;
        }
    }
    return { day: busyDay, count: max };
}

// Assumes an average of 15 seconds per video to compute estimated hours
const AVERAGE_VIDEO_DURATION_SECONDS = 15;

function extractYear(dateStr) {
    if (!dateStr) return null;
    const year = new Date(dateStr).getFullYear();
    return isNaN(year) ? null : year;
}

function main() {
    console.log("Reading data files...");
    const yearlyBreakdown = {};
    const dailyComments = {};
    const dailyLikes = {};
    const dailyReposts = {};
    const dailyWatches = {};

    // 1. Comments
    const commentsPath = path.join(tiktokDataDir, 'Comments', 'Comments.txt');
    const commentsRaw = parseBlocks(readBlocks(commentsPath));
    // Sort chronological: oldest first
    const commentsChronological = commentsRaw.slice().sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const firstComment = commentsChronological.length > 0 ? commentsChronological[0] : null;
    const totalComments = commentsRaw.length;

    // Word frequencies and Emojis in comments
    const wordCounts = {};
    const emojiCounts = {};
    const stopWords = ['the', 'and', 'i', 'a', 'to', 'it', 'you', 'of', 'in', 'that', 'is', 'for', 'my', 'on', 'with', 'this', 'at', 'so', 'but', 'be'];

    commentsRaw.forEach(c => {
        incrementYearly(yearlyBreakdown, c.Date, 'comments');
        incrementDaily(dailyComments, c.Date);
        if (c.Comment) {
            // Emojis
            const emojis = c.Comment.match(emojiRegex);
            if (emojis) {
                emojis.forEach(e => {
                    emojiCounts[e] = (emojiCounts[e] || 0) + 1;
                });
            }

            // Words
            const words = c.Comment.toLowerCase().replace(emojiRegex, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/);
            words.forEach(w => {
                if (w.length > 2 && !stopWords.includes(w)) {
                    wordCounts[w] = (wordCounts[w] || 0) + 1;
                }
            });
        }
    });

    const commonWords = Object.keys(wordCounts)
        .map(w => ({ word: w, count: wordCounts[w] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    const commonEmojis = Object.keys(emojiCounts)
        .map(e => ({ emoji: e, count: emojiCounts[e] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);


    // 2. Likes
    const likesPath = path.join(tiktokDataDir, 'Likes and Favourites', 'Like List.txt');
    const likesRaw = parseBlocks(readBlocks(likesPath));
    const likesChronological = likesRaw.slice().sort((a, b) => new Date(a.Date) - new Date(b.Date));
    const firstLike = likesChronological.length > 0 ? likesChronological[0] : null;
    const totalLikes = likesRaw.length;
    likesRaw.forEach(l => {
        incrementYearly(yearlyBreakdown, l.Date, 'likes');
        incrementDaily(dailyLikes, l.Date);
    });

    // 3. Reposts
    const repostsPath = path.join(tiktokDataDir, 'Your Activity', 'Reposts.txt');
    const repostsRaw = parseBlocks(readBlocks(repostsPath));
    // Note: Reposts use 'Creation Time'
    const repostsChronological = repostsRaw.slice().sort((a, b) => new Date(a['Creation Time']) - new Date(b['Creation Time']));
    const firstRepost = repostsChronological.length > 0 ? repostsChronological[0] : null;
    const totalReposts = repostsRaw.length;
    repostsRaw.forEach(r => {
        incrementYearly(yearlyBreakdown, r['Creation Time'], 'reposts');
        incrementDaily(dailyReposts, r['Creation Time']);
    });


    // 4. Follows
    const followsPath = path.join(tiktokDataDir, 'Profile and Settings', 'Following.txt');
    const followsRaw = parseBlocks(readBlocks(followsPath));
    followsRaw.forEach(f => incrementYearly(yearlyBreakdown, f.Date, 'follows'));


    // 5. Watch History
    const watchPath = path.join(tiktokDataDir, 'Your Activity', 'Watch History.txt');
    const watchBlocks = readBlocks(watchPath);
    // Watch history is huge, we'll just parse the length rather than stringifying it all into memory if possible, 
    // but parsing for first watch is good.
    const watchRaw = parseBlocks(watchBlocks);
    const totalWatches = watchRaw.length;
    watchRaw.forEach(w => {
        incrementYearly(yearlyBreakdown, w.Date, 'watches');
        incrementDaily(dailyWatches, w.Date);
    });

    // Post-process to calculate hours
    const totalWatchHours = Math.round((totalWatches * AVERAGE_VIDEO_DURATION_SECONDS) / 3600);
    const totalRepostHours = Math.round((totalReposts * AVERAGE_VIDEO_DURATION_SECONDS) / 3600);

    Object.keys(yearlyBreakdown).forEach(year => {
        const y = yearlyBreakdown[year];
        y.watchHours = Math.round((y.watches * AVERAGE_VIDEO_DURATION_SECONDS) / 3600);
        y.repostHours = Math.round((y.reposts * AVERAGE_VIDEO_DURATION_SECONDS) / 3600);
    });

    const busiestDays = {
        comments: getBusiestDay(dailyComments),
        likes: getBusiestDay(dailyLikes),
        reposts: getBusiestDay(dailyReposts),
        watches: getBusiestDay(dailyWatches)
    };

    // Assemble final structured data
    const wrappedData = {
        stats: {
            totalWatches,
            totalWatchHours,
            totalLikes,
            totalComments,
            totalReposts,
            totalRepostHours
        },
        firsts: {
            firstLike,
            firstComment,
            firstRepost
        },
        commonWords,
        commonEmojis,
        busiestDays,
        yearlyBreakdown
    };

    console.log("Writing data.js...");
    const fileContent = `const wrappedData = ${JSON.stringify(wrappedData, null, 2)};\nexport default wrappedData;`;
    fs.writeFileSync(outputDataFile, fileContent, 'utf-8');

    console.log("Done! metrics generated.");
}

main();
