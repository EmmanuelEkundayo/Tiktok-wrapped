/**
 * TikTok Wrapped 2026 - Vanilla JS Port
 * Logic cloned from tiktok-wrapped.jsx
 */

const DEFAULT_DATA = {
    username: "@User",
    name: "User",
    joinYear: "2021",
    totalComments: 0,
    totalLikes: 0,
    following: 0,
    totalReposts: 0,
    totalRepostHours: 0,
    totalWatches: 0,
    totalWatchHours: 0,
    topEmojis: [],
    topWords: [],
    busiestDay: "N/A",
    busiestDayCount: 0,
    yearlyData: [],
    firstComment: null,
    firstLike: null,
    firstRepost: null,
    personality: "The Wrapped Explorer",
    personalityDesc: "You're about to see your TikTok year in a whole new light."
};

let wrappedData = { ...DEFAULT_DATA };
let currentSlide = 0;
const totalSlides = 13; // intro + 11 stats slides + final

// 1. Initial UI Setup
function init() {
    createProgressSegments();
    setupNavigation();
    showSlide(0);
}

function createProgressSegments() {
    const container = document.getElementById('progress-container');
    container.innerHTML = '';
    for (let i = 0; i < totalSlides; i++) {
        const seg = document.createElement('div');
        seg.className = 'progress-segment';
        seg.id = `seg-${i}`;
        container.appendChild(seg);
    }
}

function setupNavigation() {
    document.getElementById('tap-left').onclick = () => prevSlide();
    document.getElementById('tap-right').onclick = () => nextSlide();
}

function nextSlide() {
    if (currentSlide < totalSlides - 1) {
        currentSlide++;
        showSlide(currentSlide);
    }
}

function prevSlide() {
    if (currentSlide > 0) {
        currentSlide--;
        showSlide(currentSlide);
    }
}

// 2. Slide Rendering Engine
function showSlide(index) {
    currentSlide = index;
    const viewport = document.getElementById('slides-viewport');
    viewport.innerHTML = '';
    
    // Update progress bar
    for (let i = 0; i < totalSlides; i++) {
        const seg = document.getElementById(`seg-${i}`);
        if (seg) seg.classList.toggle('active', i <= index);
    }

    const slideEl = document.createElement('div');
    slideEl.className = 'slide active';
    slideEl.innerHTML = renderSlideContent(index);
    viewport.appendChild(slideEl);
    
    // Re-attach upload listener if it's the upload slide
    if (index === 0 && !wrappedData.hasLoaded) {
        const input = document.getElementById('zip-upload');
        if (input) input.onchange = handleFileUpload;
    }
}

function renderSlideContent(index) {
    const d = wrappedData;
    
    // Slide 0: Upload / Intro
    if (index === 0) {
        if (!d.hasLoaded) {
            return `
                <div class="glass-panel animate-up">
                    <div style="font-size: 56px; margin-bottom: 16px">📊</div>
                    <h2>Upload Your Data</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 24px">Select your TikTok export ZIP file to begin.</p>
                    <label class="btn-primary">
                        Choose ZIP File
                        <input type="file" id="zip-upload" accept=".zip" style="display: none">
                    </label>
                    <div id="upload-status" style="margin-top: 16px; font-size: 13px"></div>
                </div>
            `;
        }
        return `
            <div class="animate-up">
                <div style="font-size: 64px; margin-bottom: 24px">🌑</div>
                <div class="caption">${d.username}</div>
                <h1>Your TikTok<br>Wrapped</h1>
                <p style="color: var(--text-secondary); margin-bottom: 40px">A deep dive into your digital footprints.</p>
                <button class="btn-secondary" onclick="nextSlide()">Begin the tour 👁️</button>
            </div>
        `;
    }

    // Slide 1: Primary Metrics
    if (index === 1) {
        return `
            <div class="animate-up">
                <div class="caption">Metrics 🎞️</div>
                <h2>Your commentary count</h2>
                <div style="font-size: 88px; font-weight: 900; margin-bottom: 8px">${d.totalComments.toLocaleString()}</div>
                <p style="color: var(--text-secondary); margin-bottom: 32px">comments dropped 💬</p>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${d.totalLikes.toLocaleString()}</div>
                        <div class="stat-label">Videos Liked 🤍</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${d.totalWatches.toLocaleString()}</div>
                        <div class="stat-label">Videos Watched 👁️</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Slide 2: Emojis
    if (index === 2) {
        const emojisHtml = d.topEmojis.map((e, i) => `
            <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px">
                <span style="font-size: 32px; width: 40px">${e.emoji}</span>
                <div style="flex: 1; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden">
                    <div style="width: ${i === 0 ? 100 : (e.count / d.topEmojis[0].count * 100)}%; background: #fff; height: 100%"></div>
                </div>
                <span style="font-size: 12px; color: var(--text-secondary)">${e.count}</span>
            </div>
        `).join('');
        return `
            <div class="animate-up" style="width: 100%">
                <div class="caption">Vibes 🎭</div>
                <h2>Your top reactions</h2>
                <div style="max-width: 320px; margin: 32px auto 0; text-align: left">
                    ${emojisHtml || '<p>No emoji data found</p>'}
                </div>
            </div>
        `;
    }

    // Slide 3: Best Friend
    if (index === 3) {
        return `
            <div class="animate-up">
                <div class="caption">Circle ⭕</div>
                <h2>Your TikTok Soulmate</h2>
                <div class="glass-panel" style="margin: 32px 0">
                    <div style="font-size: 3rem; font-weight: 900">${d.topWords[0] || '...'}</div>
                </div>
                <p style="color: var(--text-secondary)">You've mentioned them enough to make it official.</p>
            </div>
        `;
    }

    // Slide 4: Lexicon
    if (index === 4) {
        return `
            <div class="animate-up">
                <div class="caption">Lexicon 🗣️</div>
                <h2>Words that defined your era</h2>
                <div class="glass-panel" style="margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center">
                    ${d.topWords.map((w, i) => `<span style="font-size: ${24 - i*2}px; font-weight: 700; opacity: ${1 - i*0.1}">${w}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Slide 5: Chaos (Busiest Day)
    if (index === 5) {
        return `
            <div class="animate-up">
                <div class="caption">Chaos 📅</div>
                <h2>Your most active day</h2>
                <div class="glass-panel" style="margin-top: 32px; padding: 40px 24px">
                    <div style="font-size: 40px; font-weight: 900">${d.busiestDay}</div>
                    <div style="font-size: 20px; margin-top: 12px; opacity: 0.7"><strong>${d.busiestDayCount} comments</strong> in 24h</div>
                </div>
            </div>
        `;
    }

    // Slide 6: Following/Reposts
    if (index === 6) {
        return `
            <div class="animate-up">
                <div class="caption">Network 📶</div>
                <h2>Keeping Up</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${d.following.toLocaleString()}</div>
                        <div class="stat-label">Following</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${d.totalReposts.toLocaleString()}</div>
                        <div class="stat-label">Reposts</div>
                    </div>
                </div>
                <p style="color: var(--text-secondary); margin-top: 32px">You're a curator of the highest order.</p>
            </div>
        `;
    }

    // Slide 7: Legacy (Join Year)
    if (index === 7) {
        return `
            <div class="animate-up">
                <div class="caption">Legacy 🏛️</div>
                <h2>Since ${d.joinYear}</h2>
                <div class="glass-panel" style="margin-top: 32px; padding: 40px 24px">
                    <div style="font-size: 24px; font-weight: 900">The Journey Started</div>
                    <p style="color: var(--text-secondary); margin-top: 16px">You've seen trends come and go, but your style is eternal.</p>
                </div>
            </div>
        `;
    }

    // Slide 8: Yearly Growth
    if (index === 8) {
        const yearlyHtml = d.yearlyData.map(y => `
            <div class="stat-card" style="margin-bottom: 12px; text-align: left">
                <div style="font-size: 18px; font-weight: 900; margin-bottom: 8px">${y.year}</div>
                <div style="display: flex; gap: 16px; font-size: 12px; opacity: 0.8">
                    <span>❤️ ${y.likes}</span>
                    <span>🗣️ ${y.comments}</span>
                    <span>🔄 ${y.reposts}</span>
                </div>
            </div>
        `).join('');
        return `
            <div class="animate-up" style="width: 100%; max-height: 80vh; overflow-y: auto">
                <div class="caption">Timeline ⏳</div>
                <h2 style="margin-bottom: 24px">A Year by Year Look</h2>
                ${yearlyHtml || '<p>Searching history...</p>'}
            </div>
        `;
    }

    // Slide 9: Milestones
    if (index === 9) {
        return `
            <div class="animate-up" style="width: 100%">
                <div class="caption">Milestones ✨</div>
                <h2 style="margin-bottom: 32px">Where it all began</h2>
                <div style="display: flex; flex-direction: column; gap: 16px">
                    ${d.firstLike ? `
                        <a href="${d.firstLike.link}" target="_blank" class="glass-panel" style="text-decoration: none; display: flex; justify-content: space-between; align-items: center; padding: 20px">
                            <span style="color: #fff; font-weight: 700">❤️ First Like</span>
                            <span style="color: var(--text-secondary); font-size: 12px">${new Date(d.firstLike.date).toLocaleDateString()}</span>
                        </a>
                    ` : ''}
                    ${d.firstComment ? `
                        <div class="glass-panel" style="text-align: left; padding: 20px">
                            <div class="caption" style="font-size: 10px; margin-bottom: 8px">💬 First Comment</div>
                            <div style="font-style: italic; font-size: 14px">"${d.firstComment.text}"</div>
                            <div style="color: var(--text-secondary); font-size: 10px; margin-top: 8px">${new Date(d.firstComment.date).toLocaleDateString()}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Slide 10: Personality
    if (index === 10) {
        return `
            <div class="animate-up">
                <div class="caption">Identity 🧬</div>
                <div style="font-size: 80px; margin-bottom: 16px">🌌</div>
                <h2>${d.personality}</h2>
                <p style="color: var(--text-secondary); font-size: 18px">${d.totalWatchHours.toLocaleString()} hours of content later, you've found your digital groove.</p>
            </div>
        `;
    }

    // Slide 11: Summary / End
    if (index === 11) {
        return `
            <div class="animate-up">
                <div style="font-size: 64px; margin-bottom: 24px">🏁</div>
                <h2>That's a wrap,<br>${d.name}!</h2>
                <p style="color: var(--text-secondary); margin-bottom: 40px">You've dropped ${d.totalComments.toLocaleString()} comments and liked ${d.totalLikes.toLocaleString()} videos. You define the culture.</p>
                <div class="glass-panel" style="padding: 20px">
                    <div style="font-size: 11px; opacity: 0.5; margin-bottom: 8px">YOUR 2026 TIKTOK WRAPPED</div>
                    <div style="font-weight: 900">${d.username}</div>
                </div>
                <button class="btn-secondary" style="margin-top: 40px" onclick="showSlide(0)">Replay 🔄</button>
            </div>
        `;
    }
    
    return '';
}

// 3. Data Parsing Engine (The Brain)
async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('upload-status');
    status.innerText = "Processing your data...";

    try {
        const zip = await window.JSZip.loadAsync(file);
        const data = { ...DEFAULT_DATA, hasLoaded: true };
        
        const findFile = (pathPart) => {
            return Object.keys(zip.files).find(f => f.toLowerCase().includes(pathPart.toLowerCase()));
        };

        // Comments
        const commentsFile = findFile("Comments.txt");
        if (commentsFile) {
            const content = await zip.files[commentsFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.totalComments = blocks.length;
            
            const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
            const emojiCounts = {};
            const wordCounts = {};
            const dailyComments = {};

            blocks.forEach(b => {
                const lines = b.split('\n');
                let dateStr = "";
                let commentStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dateStr = l.split(":").slice(1).join(":").trim();
                    if (l.trim().startsWith("Comment:")) commentStr = l.split(":").slice(1).join(":").trim();
                });

                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        const dayKey = d.toISOString().split('T')[0];
                        dailyComments[dayKey] = (dailyComments[dayKey] || 0) + 1;
                    }
                }

                if (commentStr) {
                    const emojis = commentStr.match(emojiRegex);
                    if (emojis) emojis.forEach(e => emojiCounts[e] = (emojiCounts[e] || 0) + 1);
                    const words = commentStr.toLowerCase().replace(emojiRegex, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                    words.forEach(w => { if (w.length > 4) wordCounts[w] = (wordCounts[w] || 0) + 1; });
                }
            });

            data.topEmojis = Object.entries(emojiCounts).sort((a,b) => b[1]-a[1]).slice(0,5).map(e => ({emoji: e[0], count: e[1]}));
            data.topWords = Object.entries(wordCounts).sort((a,b) => b[1]-a[1]).slice(0,7).map(w => w[0]);
            
            let maxC = 0, bDay = "";
            Object.entries(dailyComments).forEach(([d, c]) => { if (c > maxC) { maxC = c; bDay = d; } });
            data.busiestDay = bDay;
            data.busiestDayCount = maxC;

            // First comment
            let earliest = Infinity;
            blocks.forEach(b => {
                const lines = b.split('\n');
                let dStr = "", cStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dStr = l.split(":").slice(1).join(":").trim();
                    if (l.trim().startsWith("Comment:")) cStr = l.split(":").slice(1).join(":").trim();
                });
                if (dStr) {
                    const d = new Date(dStr).getTime();
                    if (!isNaN(d) && d < earliest) { earliest = d; data.firstComment = { date: dStr, text: cStr }; }
                }
            });
        }

        // Likes
        const likesFile = findFile("Like List.txt");
        if (likesFile) {
            const content = await zip.files[likesFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.totalLikes = blocks.length;
            let earliest = Infinity;
            blocks.forEach(b => {
                const lines = b.split('\n');
                let dStr = "", lStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dStr = l.split(":").slice(1).join(":").trim();
                    if (l.trim().startsWith("Link:")) lStr = l.split("Link:")[1].trim();
                });
                if (dStr) {
                    const d = new Date(dStr).getTime();
                    if (!isNaN(d) && d < earliest) { earliest = d; data.firstLike = { date: dStr, link: lStr }; }
                }
            });
        }

        // Reposts
        const repostsFile = findFile("Reposts.txt");
        if (repostsFile) {
            const content = await zip.files[repostsFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.totalReposts = blocks.length;
            data.totalRepostHours = Math.round((blocks.length * 15) / 3600);
        }

        // Watch History
        const watchFile = findFile("Watch History.txt");
        if (watchFile) {
            const content = await zip.files[watchFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.totalWatches = blocks.length;
            data.totalWatchHours = Math.round((blocks.length * 15) / 3600);
        }

        // Profile Info
        const profileFile = findFile("Profile Info.txt");
        if (profileFile) {
            const content = await zip.files[profileFile].async("string");
            const uMatch = content.match(/Username:\s*(.*)/);
            if (uMatch) data.username = "@" + uMatch[1].trim();
            const jMatch = content.match(/Registration Date:\s*(.*)/);
            if (jMatch) data.joinYear = new Date(jMatch[1].trim()).getFullYear();
            const fMatch = content.match(/Following:\s*(\d+)/);
            if (fMatch) data.following = parseInt(fMatch[1], 10);
        }

        // Yearly Aggregation (Parity Check)
        const yearlyMap = {};
        const getYearFromBlock = (b) => {
            const m = b.match(/(Date|Creation Time|Timestamp):\s*([\d\-\:\s]+)/i);
            if (m) { const d = new Date(m[2].trim()); if (!isNaN(d.getTime())) return d.getFullYear(); }
            return null;
        };
        const incYear = (b, type) => { const y = getYearFromBlock(b); if (y) { if (!yearlyMap[y]) yearlyMap[y] = {likes:0,comments:0,reposts:0}; yearlyMap[y][type]++; } };
        
        if (commentsFile) {
            const content = await zip.files[commentsFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYear(b, 'comments'));
        }
        if (likesFile) {
            const content = await zip.files[likesFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYear(b, 'likes'));
        }
        if (repostsFile) {
            const content = await zip.files[repostsFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYear(b, 'reposts'));
        }
        data.yearlyData = Object.entries(yearlyMap).sort((a,b) => a[0]-b[0]).map(([year, stats]) => ({ year, ...stats }));

        // Personality
        if (data.totalWatches > 10000) { data.personality = "The Scroll-a-holic"; data.personalityDesc = "Your thumb is basically an Olympian at this point."; }
        else if (data.totalComments > 500) { data.personality = "The Social Butterfly"; data.personalityDesc = "TikTok isn't just an app, it's a conversation."; }

        wrappedData = data;
        showSlide(0); // Move to intro slide

    } catch (err) {
        console.error(err);
        status.innerText = "Error processing ZIP. Make sure it's the correct TikTok data export.";
    }
}

// Global exposure for onClick handlers
window.nextSlide = nextSlide;
window.prevSlide = prevSlide;
window.showSlide = showSlide;

// Run Init
window.addEventListener('DOMContentLoaded', init);
