let wrappedData = null;

// File Upload Handler
document.getElementById('zip-upload').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const status = document.getElementById('upload-status');
    const startBtn = document.getElementById('start-btn');
    const uploadLabel = document.getElementById('upload-label');

    status.innerText = "Processing your TikTok data...";
    uploadLabel.style.display = "none";

    try {
        const zip = await window.JSZip.loadAsync(file);
        
        const data = {
            stats: { totalWatches: 0, totalWatchHours: 0, totalLikes: 0, totalComments: 0, totalReposts: 0, totalRepostHours: 0 },
            firsts: {},
            commonWords: [],
            commonEmojis: [],
            busiestDays: {},
            yearlyBreakdown: {}
        };

        const findFile = (name) => Object.keys(zip.files).find(f => f.includes(name));

        // 1. Comments
        const commentsFile = findFile("Comments/Comments.txt") || findFile("Comments.txt");
        if (commentsFile) {
            const content = await zip.files[commentsFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.stats.totalComments = blocks.length;
            
            const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
            const emojiCounts = {};
            const dailyComments = {};

            blocks.forEach(b => {
                const lines = b.split('\n');
                let dateStr = "";
                let commentStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dateStr = l.split(":")[1].trim() + ":" + l.split(":")[2].trim() + ":" + l.split(":")[3].trim();
                    if (l.trim().startsWith("Comment:")) commentStr = l.split(":")[1].trim();
                });

                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) {
                        const dayKey = d.toISOString().split('T')[0];
                        dailyComments[dayKey] = (dailyComments[dayKey] || 0) + 1;
                        const year = d.getFullYear();
                        if (!data.yearlyBreakdown[year]) data.yearlyBreakdown[year] = { watches: 0, likes: 0, comments: 0, reposts: 0, follows: 0, watchHours: 0, repostHours: 0 };
                        data.yearlyBreakdown[year].comments++;
                    }
                }
                if (commentStr) {
                    const emojis = commentStr.match(emojiRegex);
                    if (emojis) emojis.forEach(e => emojiCounts[e] = (emojiCounts[e] || 0) + 1);
                }
            });

            data.commonEmojis = Object.entries(emojiCounts).sort((a,b) => b[1]-a[1]).slice(0,5).map(e => ({emoji: e[0], count: e[1]}));
            let maxC = 0, bDay = "";
            let earliestC = Infinity;
            Object.entries(dailyComments).forEach(([d, c]) => { if (c > maxC) { maxC = c; bDay = d; } });
            data.busiestDays.comments = { day: bDay, count: maxC };

            blocks.forEach(b => {
                const lines = b.split('\n');
                let dStr = "", cStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dStr = l.split(":")[1].trim() + ":" + l.split(":")[2].trim() + ":" + l.split(":")[3].trim();
                    if (l.trim().startsWith("Comment:")) cStr = l.split(":")[1].trim();
                });
                if (dStr) {
                    const d = new Date(dStr);
                    if (!isNaN(d.getTime()) && d.getTime() < earliestC) {
                        earliestC = d.getTime();
                        data.firsts.comment = { date: dStr, text: cStr };
                    }
                }
            });
        }

        // 2. Likes
        const likesFile = findFile("Likes and Favourites/Like List.txt") || findFile("Like List.txt");
        if (likesFile) {
            const content = await zip.files[likesFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.stats.totalLikes = blocks.length;

            let earliestL = Infinity;
            blocks.forEach(b => {
                const lines = b.split('\n');
                let dateStr = "";
                let linkStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Date:")) dateStr = l.split(":")[1].trim() + ":" + l.split(":")[2].trim() + ":" + l.split(":")[3].trim();
                    if (l.trim().startsWith("Link:")) linkStr = l.split("Link:")[1].trim();
                });
                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime()) && d.getTime() < earliestL) {
                        earliestL = d.getTime();
                        data.firsts.like = { date: dateStr, link: linkStr };
                    }
                }
            });
        }

        // 3. Reposts
        const repostsFile = findFile("Your Activity/Reposts.txt") || findFile("Reposts.txt");
        if (repostsFile) {
            const content = await zip.files[repostsFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.stats.totalReposts = blocks.length;

            let earliestR = Infinity;
            blocks.forEach(b => {
                const lines = b.split('\n');
                let dateStr = "";
                let linkStr = "";
                lines.forEach(l => {
                    if (l.trim().startsWith("Creation Time:")) dateStr = l.split(":")[1].trim() + ":" + l.split(":")[2].trim() + ":" + l.split(":")[3].trim();
                    if (l.trim().startsWith("Link:")) linkStr = l.split("Link:")[1].trim();
                });
                if (dateStr) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime()) && d.getTime() < earliestR) {
                        earliestR = d.getTime();
                        data.firsts.repost = { date: dateStr, link: linkStr };
                    }
                }
            });
        }

        wrappedData = data;
        status.innerText = "Data processed successfully!";
        startBtn.style.display = "inline-block";
        initializeData();

    } catch (err) {
        console.error(err);
        status.innerText = "Error processing ZIP file. Please try again.";
        uploadLabel.style.display = "inline-block";
    }
});

window.nextSlide = function (slideIndex) {
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));
    const targetSlide = document.getElementById(`slide-${slideIndex}`);
    if (targetSlide) {
        targetSlide.classList.add('active');
        animateNumbers(targetSlide);
    }
};

function animateNumbers(slide) {
    if (!wrappedData) return;
    const numberElements = slide.querySelectorAll('.number');
    numberElements.forEach(el => {
        const targetKey = el.getAttribute('data-target');
        const targetValue = wrappedData.stats[targetKey] || 0;
        let startTimestamp = null;
        const duration = 2000;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            el.innerText = Math.floor(easeProgress * targetValue).toLocaleString();
            if (progress < 1) window.requestAnimationFrame(step);
        };
        window.requestAnimationFrame(step);
    });
}

function formatDateFriendly(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return dateStr; }
}

function initializeData() {
    if (!wrappedData) return;

    // Top Emojis
    const emojisContainer = document.getElementById('emojis-container');
    if (emojisContainer && wrappedData.commonEmojis) {
        let html = '<div style="font-size: 3rem; display: flex; justify-content: center; gap: 20px;">';
        wrappedData.commonEmojis.forEach(e => {
            html += `<div title="Used ${e.count} times">${e.emoji}</div>`;
        });
        html += '</div>';
        emojisContainer.innerHTML = html;
    }

    // Yearly Breakdown
    const yearlyContainer = document.getElementById('yearly-container');
    if (yearlyContainer && wrappedData.yearlyBreakdown) {
        const years = Object.keys(wrappedData.yearlyBreakdown).sort();
        let html = '';
        years.forEach(year => {
            const d = wrappedData.yearlyBreakdown[year];
            html += `
            <div class="year-card">
                <h3>${year}</h3>
                <p>❤️ ${d.likes.toLocaleString()}</p>
                <p>🗣️ ${d.comments.toLocaleString()}</p>
                <p>🔄 ${d.reposts.toLocaleString()}</p>
            </div>`;
        });
        yearlyContainer.innerHTML = html;
    }

    // Busiest Days
    const busiestContainer = document.getElementById('busiest-container');
    if (busiestContainer && wrappedData.busiestDays) {
        let html = '';
        const b = wrappedData.busiestDays;
        if (b.comments && b.comments.day) {
            html += `
            <div class="first-card comment-card">
                <h3>Most Commented In A Day</h3>
                <p><strong>${formatDateFriendly(b.comments.day)}</strong></p>
                <p>${b.comments.count.toLocaleString()} comments made</p>
            </div>`;
        }
        busiestContainer.innerHTML = html;
    }

    // Summary screen
    document.getElementById('sum-watches').innerText = wrappedData.stats.totalWatches.toLocaleString();
    document.getElementById('sum-likes').innerText = wrappedData.stats.totalLikes.toLocaleString();
    document.getElementById('sum-comments').innerText = wrappedData.stats.totalComments.toLocaleString();
    document.getElementById('sum-reposts').innerText = wrappedData.stats.totalReposts.toLocaleString();

    // Add milestones to summary panel
    const summaryPanel = document.querySelector('.summary-panel');
    let memoriesHtml = '<div style="margin-top: 2rem; text-align: left; background: rgba(255,255,255,0.05); padding: 20px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);">';
    memoriesHtml += '<h3 style="font-size: 1rem; margin-bottom: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Interaction Milestones</h3>';
    
    if (wrappedData.firsts.like) {
        memoriesHtml += `<a href="${wrappedData.firsts.like.link}" target="_blank" style="display: block; color: #fff; text-decoration: none; margin-bottom: 10px; font-size: 0.9rem;">🤍 Your First Like</a>`;
    }
    if (wrappedData.firsts.repost) {
        memoriesHtml += `<a href="${wrappedData.firsts.repost.link}" target="_blank" style="display: block; color: #fff; text-decoration: none; margin-bottom: 10px; font-size: 0.9rem;">🔄 Your First Repost</a>`;
    }
    if (wrappedData.firsts.comment) {
        memoriesHtml += `<div style="color: #fff; font-size: 0.9rem; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.1);">
            <small style="color: #666;">FIRST COMMENT (${new Date(wrappedData.firsts.comment.date).toLocaleDateString()}):</small><br>
            <i style="color: #ccc;">"${wrappedData.firsts.comment.text}"</i>
        </div>`;
    }
    memoriesHtml += '</div>';
    
    const existingMemories = summaryPanel.querySelector('.memories-container');
    if (existingMemories) existingMemories.remove();
    
    const div = document.createElement('div');
    div.className = 'memories-container';
    div.innerHTML = memoriesHtml;
    summaryPanel.insertBefore(div, summaryPanel.querySelector('button'));
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 40, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.2, "random": true },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": false },
                "move": { "enable": true, "speed": 1, "direction": "none", "random": true, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "bubble" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "bubble": { "distance": 200, "size": 4, "duration": 2, "opacity": 1, "speed": 3 }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }
});
