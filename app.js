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
            username: "@User",
            stats: {
                totalLikes: 0,
                totalComments: 0,
                totalWatches: 0,
                totalWatchHours: 0,
                totalReposts: 0,
                totalRepostHours: 0,
                following: 0
            },
            firsts: {
                like: null,
                comment: null,
                repost: null
            },
            monthlyData: {},
            emojis: [],
            words: [],
            busiestDays: [],
            personality: "The Wrapped Explorer",
            personalityDesc: "You've found your digital groove.",
            bestFriend: "...",
            joinYear: "2021",
            yearlyData: []
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

            data.emojis = Object.entries(emojiCounts).sort((a,b) => b[1]-a[1]).slice(0,5).map(e => ({char: e[0], count: e[1]}));
            let maxC = 0, bDay = "";
            Object.entries(dailyComments).forEach(([d, c]) => { if (c > maxC) { maxC = c; bDay = d; } });
            if (bDay) data.busiestDays.push({ day: bDay, count: maxC });

            let earliestC = Infinity;
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
            data.stats.totalRepostHours = Math.round((blocks.length * 15) / 3600);

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

        // 4. Watch History
        const watchFile = findFile("Your Activity/Watch History.txt") || findFile("Watch History.txt");
        if (watchFile) {
            const content = await zip.files[watchFile].async("string");
            const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
            data.stats.totalWatches = blocks.length;
            data.stats.totalWatchHours = Math.round((blocks.length * 15) / 3600);
        }

        // 5. Profile Info
        const profileFile = findFile("Profile/Profile Info.txt") || findFile("Profile Info.txt");
        if (profileFile) {
            const content = await zip.files[profileFile].async("string");
            const uMatch = content.match(/Username:\s*(.*)/);
            if (uMatch) data.username = "@" + uMatch[1].trim();
            const jMatch = content.match(/Registration Date:\s*(.*)/);
            if (jMatch) data.joinYear = new Date(jMatch[1].trim()).getFullYear();
            const fMatch = content.match(/Following:\s*(\d+)/);
            if (fMatch) data.stats.following = parseInt(fMatch[1], 10);
        }

        // 6. Best Friend (from comments)
        const commentsFile2 = findFile("Comments/Comments.txt") || findFile("Comments.txt");
        if (commentsFile2) {
             const content = await zip.files[commentsFile2].async("string");
             const wordCounts = {};
             const words = content.toLowerCase().match(/\b\w{5,}\b/g); // Words with 5 or more characters
             if (words) {
                 words.forEach(w => { wordCounts[w] = (wordCounts[w] || 0) + 1; });
                 data.words = Object.entries(wordCounts).sort((a,b) => b[1]-a[1]).slice(0,10).map(([word, count]) => ({word, count}));
                 data.bestFriend = data.words[0]?.word || "...";
             }
        }

        // Personality
        if (data.stats.totalWatches > 10000) {
            data.personality = "The Scroll-a-holic";
            data.personalityDesc = "Your thumb is basically an Olympian at this point.";
        } else if (data.stats.totalComments > 500) {
            data.personality = "The Social Butterfly";
            data.personalityDesc = "TikTok isn't just an app for you, it's a conversation.";
        } else {
            data.personality = "The Zen Viewer";
            data.personalityDesc = "You watch, you enjoy, you keep it simple.";
        }

        // 7. Yearly Stats Aggregator
        const yearlyDataMap = {};
        const extractDate = (block) => {
            const m = block.match(/(Date|Creation Time|Timestamp):\s*([\d\-\:\s]+)/i);
            return m ? m[2].trim() : null;
        };

        const incYearly = (block, type) => {
            const dateStr = extractDate(block);
            if (!dateStr) return;
            const y = new Date(dateStr).getFullYear();
            if (isNaN(y)) return;
            if (!yearlyDataMap[y]) yearlyDataMap[y] = { likes: 0, comments: 0, reposts: 0 };
            yearlyDataMap[y][type]++;
        };

        if (commentsFile) {
            const content = await zip.files[commentsFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYearly(b, 'comments'));
        }
        if (likesFile) {
            const content = await zip.files[likesFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYearly(b, 'likes'));
        }
        if (repostsFile) {
            const content = await zip.files[repostsFile].async("string");
            content.split(/\n\s*\n/).forEach(b => incYearly(b, 'reposts'));
        }
        data.yearlyData = Object.entries(yearlyDataMap).sort((a,b) => a[0]-b[0]).map(([year, stats]) => ({ year, ...stats }));

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

let currentSlide = 0; // 0 is the upload screen
const totalSlides = 13; // 0 (upload) to 12 (summary)
// wrappedData is already declared at the top of the file

function updateProgress() {
    const container = document.getElementById('progress-bar-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Only show segments if we've started the tour (Slide 1+)
    if (currentSlide === 0) return;

    for (let i = 1; i < totalSlides; i++) {
        const segment = document.createElement('div');
        segment.style.flex = '1';
        segment.style.height = '2px';
        segment.style.borderRadius = '2px';
        segment.style.background = i <= currentSlide ? '#fff' : 'rgba(255,255,255,0.2)';
        segment.style.transition = 'background 0.3s ease';
        container.appendChild(segment);
    }
}

function showSlide(index) {
    if (index < 0 || index >= totalSlides) return;
    
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => slide.classList.remove('active'));
    
    const target = document.getElementById(`slide-${index}`);
    if (target) {
        target.classList.add('active');
        currentSlide = index;
        updateProgress();
        document.getElementById('slide-counter').innerText = `${currentSlide} / ${totalSlides - 1}`;
        animateNumbers(target); // Call animateNumbers for the new slide
    }
}

function nextSlide() {
    if (currentSlide > 0 && currentSlide < totalSlides - 1) showSlide(currentSlide + 1);
}

function prevSlide() {
    if (currentSlide > 1) showSlide(currentSlide - 1); // Don't go back to slide 0 (upload screen)
}

// Global Nav Listeners
document.getElementById('tap-left').addEventListener('click', (e) => {
    if (currentSlide > 0) prevSlide();
});

document.getElementById('tap-right').addEventListener('click', (e) => {
    if (currentSlide > 0) nextSlide();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (wrappedData) { // Only allow navigation after data is loaded
        if (e.key === 'ArrowRight') {
            nextSlide();
        } else if (e.key === 'ArrowLeft') {
            prevSlide();
        }
    }
});

// Initial call to update progress bar (will be empty until first slide)
updateProgress();

// The old window.nextSlide is replaced by showSlide, nextSlide, prevSlide
// window.nextSlide = function (slideIndex) {
//     const slides = document.querySelectorAll('.slide');
//     slides.forEach(slide => slide.classList.remove('active'));
//     const targetSlide = document.getElementById(`slide-${slideIndex}`);
//     if (targetSlide) {
//         targetSlide.classList.add('active');
//         animateNumbers(targetSlide);
//     }
// };

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

    // Intro
    document.getElementById('intro-username').innerText = wrappedData.username;
    document.getElementById('intro-name').innerText = wrappedData.username.replace('@', '');
    document.getElementById('intro-likes').innerText = wrappedData.stats.totalLikes.toLocaleString();
    document.getElementById('intro-comments').innerText = wrappedData.stats.totalComments.toLocaleString();

    // Stats Slide
    document.getElementById('stats-total-comments').innerText = wrappedData.stats.totalComments.toLocaleString();
    document.getElementById('stats-total-likes').innerText = wrappedData.stats.totalLikes.toLocaleString();
    document.getElementById('stats-total-watch-hours').innerText = wrappedData.stats.totalWatchHours.toLocaleString();
    document.getElementById('stats-total-repost-hours').innerText = wrappedData.stats.totalRepostHours.toLocaleString();


    // Emojis
    const emojiContainer = document.getElementById('emoji-list-container');
    if (emojiContainer) {
        emojiContainer.innerHTML = '';
        wrappedData.emojis.slice(0, 4).forEach((e, i) => {
            const div = document.createElement('div');
            div.className = 'glass-panel';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.padding = '1rem 1.5rem';
            div.innerHTML = `
                <span style="font-size: 2rem;">${e.char}</span>
                <span style="font-size: 1.25rem; font-weight: 700;">${e.count.toLocaleString()}</span>
            `;
            emojiContainer.appendChild(div);
        });
    }

    // Best Friend
    document.getElementById('best-friend-name').innerText = wrappedData.bestFriend || "...";

    // Words Cloud
    const wordCloud = document.getElementById('words-cloud-container');
    if (wordCloud) {
        wordCloud.innerHTML = '';
        wrappedData.words.slice(0, 10).forEach(w => {
            const span = document.createElement('span');
            span.style.fontSize = `${1.2 + Math.random()}rem`;
            span.style.fontWeight = '700';
            span.style.color = `rgba(255,255,255,${0.5 + Math.random() * 0.5})`;
            span.innerText = w.word;
            wordCloud.appendChild(span);
        });
    }

    // Busiest Day
    if (wrappedData.busiestDays && wrappedData.busiestDays[0]) {
        document.getElementById('busiest-day-name').innerText = formatDateFriendly(wrappedData.busiestDays[0].day);
        document.getElementById('busiest-day-count').innerText = wrappedData.busiestDays[0].count.toLocaleString();
    }

    // Following
    document.getElementById('stats-following').innerText = wrappedData.stats.following.toLocaleString();
    document.getElementById('stats-reposts').innerText = wrappedData.stats.totalReposts.toLocaleString();

    // Journey
    document.getElementById('join-year-display').innerText = wrappedData.joinYear || "2021";

    // Timeline
    const timelineContainer = document.getElementById('yearly-timeline-container');
    if (timelineContainer && wrappedData.yearlyData) {
        timelineContainer.innerHTML = '';
        wrappedData.yearlyData.forEach(y => {
            const item = document.createElement('div');
            item.className = 'glass-panel';
            item.style.padding = '0.75rem';
            item.style.width = '100%';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 1.1rem; font-weight: 900;">${y.year}</span>
                    <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">🔄 ${y.reposts.toLocaleString()}</span>
                </div>
                <div style="display: flex; gap: 1rem; font-size: 0.75rem; color: rgba(255,255,255,0.6);">
                    <span>❤️ ${y.likes.toLocaleString()}</span>
                    <span>🗣️ ${y.comments.toLocaleString()}</span>
                </div>
            `;
            timelineContainer.appendChild(item);
        });
    }

    // Personality
    document.getElementById('personality-name').innerText = wrappedData.personality || "The Wrapped Explorer";
    document.getElementById('personality-desc').innerText = wrappedData.personalityDesc || "You've found your digital groove.";

    // Firsts Slide
    const firstsSlideContainer = document.getElementById('slide-firsts-container');
    if (firstsSlideContainer) {
        firstsSlideContainer.innerHTML = '';
        if (wrappedData.firsts.like) {
            const a = document.createElement('a');
            a.href = wrappedData.firsts.like.link;
            a.target = '_blank';
            a.className = 'glass-panel';
            a.style.cssText = 'text-decoration: none; display: flex; align-items: center; justify-content: space-between; padding: 20px; width: 100%;';
            a.innerHTML = `<span style="color: #fff; font-weight: 700;">❤️ First Like</span><span style="color: rgba(255,255,255,0.5); font-size: 13px;">${new Date(wrappedData.firsts.like.date).toLocaleDateString()}</span>`;
            firstsSlideContainer.appendChild(a);
        }
        if (wrappedData.firsts.repost) {
            const a = document.createElement('a');
            a.href = wrappedData.firsts.repost.link;
            a.target = '_blank';
            a.className = 'glass-panel';
            a.style.cssText = 'text-decoration: none; display: flex; align-items: center; justify-content: space-between; padding: 20px; width: 100%;';
            a.innerHTML = `<span style="color: #fff; font-weight: 700;">🔄 First Repost</span><span style="color: rgba(255,255,255,0.5); font-size: 13px;">${new Date(wrappedData.firsts.repost.date).toLocaleDateString()}</span>`;
            firstsSlideContainer.appendChild(a);
        }
        if (wrappedData.firsts.comment) {
            const div = document.createElement('div');
            div.className = 'glass-panel';
            div.style.cssText = 'text-align: left; padding: 20px; width: 100%;';
            div.innerHTML = `
                <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-bottom: 8px; text-transform: uppercase;">💬 First Comment</div>
                <div style="color: #fff; fontSize: 15px; font-style: italic; line-height: 1.4;">"${wrappedData.firsts.comment.text}"</div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.3); margin-top: 8px;">${new Date(wrappedData.firsts.comment.date).toLocaleDateString()}</div>
            `;
            firstsSlideContainer.appendChild(div);
        }
    }

    // Summary screen
    document.getElementById('sum-watches').innerText = wrappedData.stats.totalWatches.toLocaleString();
    document.getElementById('sum-hours').innerText = wrappedData.stats.totalWatchHours.toLocaleString();
    document.getElementById('sum-likes').innerText = wrappedData.stats.totalLikes.toLocaleString();
    document.getElementById('sum-comments').innerText = wrappedData.stats.totalComments.toLocaleString();
    document.getElementById('sum-reposts').innerText = wrappedData.stats.totalReposts.toLocaleString();
    
    document.getElementById('final-summary-text').innerHTML = `
        You've dropped <strong>${wrappedData.stats.totalComments.toLocaleString()}</strong> comments 
        and spent <strong>${wrappedData.stats.totalWatchHours.toLocaleString()}</strong> hours watching. 
        You define the culture.
    `;

    // Firsts
    const firstsContainer = document.getElementById('firsts-container');
    if (firstsContainer) {
        firstsContainer.innerHTML = '';
        if (wrappedData.firsts.like) {
            const a = document.createElement('a');
            a.href = wrappedData.firsts.like.link;
            a.target = '_blank';
            a.className = 'btn';
            a.style.cssText = 'text-decoration: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 12px 20px; font-size: 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 100%;';
            a.innerHTML = `<span>❤️ Your First Like</span><span style="opacity: 0.5;">${new Date(wrappedData.firsts.like.date).toLocaleDateString()}</span>`;
            firstsContainer.appendChild(a);
        }
        if (wrappedData.firsts.repost) {
            const a = document.createElement('a');
            a.href = wrappedData.firsts.repost.link;
            a.target = '_blank';
            a.className = 'btn';
            a.style.cssText = 'text-decoration: none; display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 12px 20px; font-size: 14px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); width: 100%;';
            a.innerHTML = `<span>🔄 Your First Repost</span><span style="opacity: 0.5;">${new Date(wrappedData.firsts.repost.date).toLocaleDateString()}</span>`;
            firstsContainer.appendChild(a);
        }
        if (wrappedData.firsts.comment) {
            const div = document.createElement('div');
            div.className = 'glass-panel';
            div.style.cssText = 'text-align: left; padding: 12px 20px; width: 100%;';
            div.innerHTML = `
                <div style="font-size: 10px; opacity: 0.5; margin-bottom: 4px;">💬 YOUR FIRST COMMENT</div>
                <div style="font-size: 13px; font-style: italic; line-height: 1.4;">"${wrappedData.firsts.comment.text}"</div>
                <div style="font-size: 10px; opacity: 0.4; margin-top: 6px;">${new Date(wrappedData.firsts.comment.date).toLocaleDateString()}</div>
            `;
            firstsContainer.appendChild(div);
        }
    }
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
