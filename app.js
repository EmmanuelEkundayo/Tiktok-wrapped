import wrappedData from './data.js';

window.nextSlide = function (slideIndex) {
    // Hide all slides
    const slides = document.querySelectorAll('.slide');
    slides.forEach(slide => {
        slide.classList.remove('active');
    });

    // Show target slide
    const targetSlide = document.getElementById(`slide-${slideIndex}`);
    if (targetSlide) {
        targetSlide.classList.add('active');
        // Trigger animations for numbers if applicable
        animateNumbers(targetSlide);
    }
};

function animateNumbers(slide) {
    const numberElements = slide.querySelectorAll('.number');

    numberElements.forEach(el => {
        const targetKey = el.getAttribute('data-target');
        const targetValue = wrappedData.stats[targetKey] || 0;

        let startTimestamp = null;
        const duration = 2000; // 2 seconds

        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);

            // Ease out expo
            const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

            el.innerText = Math.floor(easeProgress * targetValue).toLocaleString();

            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };

        window.requestAnimationFrame(step);
    });
}

function formatDateFriendly(dateStr) {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dateStr;
    }
}

function initializeData() {
    // Common Words
    const wordsContainer = document.getElementById('common-words-list');
    if (wordsContainer && wrappedData.commonWords) {
        let html = '';
        wrappedData.commonWords.slice(0, 8).forEach(wordObj => {
            html += `<div class="word-pill">${wordObj.word} <span>x${wordObj.count}</span></div>`;
        });
        wordsContainer.innerHTML = html;
    }

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
            const data = wrappedData.yearlyBreakdown[year];
            html += `
            <div class="year-card" style="position:relative;">
                <h3>${year}</h3>
                <p title="~${data.watchHours} estimated hours">👀 ${data.watches.toLocaleString()} <span style="font-size:0.75rem;color:#888;">(~${data.watchHours} hrs)</span></p>
                <p>❤️ ${data.likes.toLocaleString()}</p>
                <p>🗣️ ${data.comments.toLocaleString()}</p>
                <p title="~${data.repostHours} estimated hours">🔄 ${data.reposts.toLocaleString()} <span style="font-size:0.75rem;color:#888;">(~${data.repostHours} hrs)</span></p>
                <p>👤 ${data.follows.toLocaleString()}</p>
            </div>`;
        });
        yearlyContainer.innerHTML = html;
    }

    // Busiest Days
    const busiestContainer = document.getElementById('busiest-container');
    if (busiestContainer && wrappedData.busiestDays) {
        let html = '';
        const b = wrappedData.busiestDays;

        if (b.watches && b.watches.day) {
            html += `
            <div class="first-card like-card">
                <h3>Most Watched In A Day</h3>
                <p><strong>${formatDateFriendly(b.watches.day)}</strong></p>
                <p>${b.watches.count.toLocaleString()} videos watched</p>
            </div>`;
        }
        if (b.likes && b.likes.day) {
            html += `
            <div class="first-card like-card" style="border-color: #ff2a5f;">
                <h3>Most Liked In A Day</h3>
                <p><strong>${formatDateFriendly(b.likes.day)}</strong></p>
                <p>${b.likes.count.toLocaleString()} videos liked</p>
            </div>`;
        }
        if (b.comments && b.comments.day) {
            html += `
            <div class="first-card comment-card">
                <h3>Most Commented In A Day</h3>
                <p><strong>${formatDateFriendly(b.comments.day)}</strong></p>
                <p>${b.comments.count.toLocaleString()} comments made</p>
            </div>`;
        }
        if (b.reposts && b.reposts.day) {
            html += `
            <div class="first-card repost-card">
                <h3>Most Reposted In A Day</h3>
                <p><strong>${formatDateFriendly(b.reposts.day)}</strong></p>
                <p>${b.reposts.count.toLocaleString()} videos reposted</p>
            </div>`;
        }

        busiestContainer.innerHTML = html;
    }


    // Firsts
    const firstsContainer = document.getElementById('firsts-container');
    if (firstsContainer) {
        let html = '';
        const f = wrappedData.firsts;

        if (f.firstComment) {
            html += `
            <div class="first-card comment-card">
                <h3>🗣️ Your First Comment</h3>
                <p>Date: ${f.firstComment.Date}</p>
                <p><i>"${f.firstComment.Comment}"</i></p>
            </div>`;
        }
        if (f.firstLike) {
            html += `
            <div class="first-card like-card">
                <h3>❤️ Your First Like</h3>
                <p>Date: ${f.firstLike.Date || f.firstLike['Date']}</p>
                <a href="${f.firstLike.Link}" target="_blank" style="color:var(--primary)">View Video</a>
            </div>`;
        }
        if (f.firstRepost) {
            html += `
            <div class="first-card repost-card">
                <h3>🔄 Your First Repost</h3>
                <p>Date: ${f.firstRepost['Creation Time']}</p>
                 <a href="${f.firstRepost.Link}" target="_blank" style="color:var(--primary)">View Video</a>
            </div>`;
        }
        firstsContainer.innerHTML = html;
    }

    // Summary screen
    document.getElementById('sum-watches').innerText = wrappedData.stats.totalWatches.toLocaleString();
    document.getElementById('sum-likes').innerText = wrappedData.stats.totalLikes.toLocaleString();
    document.getElementById('sum-comments').innerText = wrappedData.stats.totalComments.toLocaleString();
    document.getElementById('sum-reposts').innerText = wrappedData.stats.totalReposts.toLocaleString();
}

// Initialize particles JS
document.addEventListener('DOMContentLoaded', () => {
    initializeData();

    // Setup nice floating particles
    if (window.particlesJS) {
        particlesJS("particles-js", {
            "particles": {
                "number": {
                    "value": 60,
                    "density": { "enable": true, "value_area": 800 }
                },
                "color": { "value": ["#00f2fe", "#fe0979"] },
                "shape": { "type": "circle" },
                "opacity": {
                    "value": 0.5,
                    "random": true,
                },
                "size": {
                    "value": 4,
                    "random": true,
                },
                "line_linked": { "enable": false },
                "move": {
                    "enable": true,
                    "speed": 2,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": { "enable": true, "mode": "bubble" },
                    "onclick": { "enable": true, "mode": "push" },
                    "resize": true
                },
                "modes": {
                    "bubble": { "distance": 200, "size": 6, "duration": 2, "opacity": 1, "speed": 3 },
                    "push": { "particles_nb": 4 }
                }
            },
            "retina_detect": true
        });
    }
});
