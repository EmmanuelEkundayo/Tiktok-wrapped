import { useState, useEffect, useRef } from "react";

// Slide configuration
const SLIDES = [
  { id: "upload" },
  { id: "intro" },
  { id: "stats" },
  { id: "emoji" },
  { id: "bestfriend" },
  { id: "words" },
  { id: "busiest" },
  { id: "following" },
  { id: "journey" },
  { id: "personality" },
  { id: "final" },
];

// Monochrome Glassmorphic Colors
const COLORS = [
  ["#000000", "#1a1a1a"],
  ["#050505", "#262626"],
  ["#000000", "#111111"],
  ["#0a0a0a", "#222222"],
  ["#000000", "#1a1a1a"],
  ["#050505", "#262626"],
  ["#000000", "#111111"],
  ["#0a0a0a", "#222222"],
  ["#000000", "#1a1a1a"],
  ["#050505", "#262626"],
  ["#000000", "#111111"],
];

const DEFAULT_DATA = {
    username: "@micaelswe",
    name: "Emmanuel",
    bio: "Online FBI",
    followers: 0,
    following: 0,
    likesReceived: 0,
    totalComments: 0,
    totalLikes: 0,
    totalWatches: 0,
    totalReposts: 0,
    topEmojis: [],
    bestFriend: "...",
    bestFriendCount: 0,
    topTags: [],
    topWords: [],
    busiestDay: "N/A",
    busiestDayCount: 0,
    peakMonth: "N/A",
    peakMonthCount: 0,
    monthlyData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    personality: "The Wrapped Explorer",
    personalityDesc: "You're about to see your TikTok year in a whole new light.",
    signatures: ["Searching...", "Loading metrics..."],
    joinYear: "2021",
};

// UI Components
function ProgressBar({ current, total }) {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "8px 12px", display: "flex", gap: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          background: i <= current ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.2)",
          transition: "background 0.3s",
        }} />
      ))}
    </div>
  );
}

// B&W Glassmorphic Panel Helper
const glassStyle = {
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(20px) saturate(180%)",
    borderRadius: 24,
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 8px 32px 0 rgba(0,0,0,0.8)",
    padding: "24px",
    width: "100%",
    maxWidth: 320,
    margin: "0 auto",
};

function SlideUpload({ onDataParsed, onNext }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Load JSZip dynamically if not present
      if (!window.JSZip) {
          await new Promise((resolve, reject) => {
              const script = document.createElement("script");
              script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
          });
      }

      const zip = await window.JSZip.loadAsync(file);
      const data = { ...DEFAULT_DATA };
      
      // Helper to find file in ZIP
      const findFile = (pathPart) => {
          return Object.keys(zip.files).find(f => f.includes(pathPart));
      };

      // 1. Comments
      const commentsFile = findFile("Comments/Comments.txt") || findFile("Comments.txt");
      if (commentsFile) {
          const content = await zip.files[commentsFile].async("string");
          const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
          data.totalComments = blocks.length;
          
          const wordCounts = {};
          const emojiCounts = {};
          const dailyComments = {};
          const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;

          blocks.forEach(b => {
              const lines = b.split('\n');
              let dateStr = "";
              let commentStr = "";
              lines.forEach(l => {
                  if (l.startsWith("Date:")) dateStr = l.split(":")[1].trim();
                  if (l.startsWith("Comment:")) commentStr = l.split(":")[1].trim();
              });

              if (dateStr) {
                  const d = new Date(dateStr);
                  if (!isNaN(d.getTime())) {
                      const dayKey = d.toISOString().split('T')[0];
                      dailyComments[dayKey] = (dailyComments[dayKey] || 0) + 1;
                      const month = d.getMonth();
                      data.monthlyData[month]++;
                  }
              }

              if (commentStr) {
                  const emojis = commentStr.match(emojiRegex);
                  if (emojis) emojis.forEach(e => emojiCounts[e] = (emojiCounts[e] || 0) + 1);
                  const words = commentStr.toLowerCase().replace(emojiRegex, '').replace(/[^a-z0-9\s]/g, '').split(/\s+/);
                  words.forEach(w => { if (w.length > 3) wordCounts[w] = (wordCounts[w] || 0) + 1; });
              }
          });

          data.topEmojis = Object.entries(emojiCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => ({ emoji: e[0], count: e[1] }));
          data.topWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).slice(0, 7).map(w => w[0]);
          
          let maxDayCount = 0;
          let busDay = "";
          let earliestCommentDate = Infinity;
          let firstComment = null;

          Object.entries(dailyComments).forEach(([day, count]) => {
              if (count > maxDayCount) { maxDayCount = count; busDay = day; }
          });

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
                  if (!isNaN(d.getTime()) && d.getTime() < earliestCommentDate) {
                      earliestCommentDate = d.getTime();
                      firstComment = { date: dateStr, text: commentStr };
                  }
              }
          });

          data.busiestDay = busDay;
          data.busiestDayCount = maxDayCount;
          data.firstComment = firstComment;
      }

      // 2. Likes
      const likesFile = findFile("Likes and Favourites/Like List.txt") || findFile("Like List.txt");
      if (likesFile) {
          const content = await zip.files[likesFile].async("string");
          const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
          data.totalLikes = blocks.length;

          let earliestLikeDate = Infinity;
          let firstLike = null;

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
                  if (!isNaN(d.getTime()) && d.getTime() < earliestLikeDate) {
                      earliestLikeDate = d.getTime();
                      firstLike = { date: dateStr, link: linkStr };
                  }
              }
          });
          data.firstLike = firstLike;
      }

      // 3. Following
      const followingFile = findFile("Profile and Settings/Following.txt") || findFile("Following.txt");
      if (followingFile) {
          const content = await zip.files[followingFile].async("string");
          data.following = content.split(/\n\s*\n/).filter(b => b.trim() !== '').length;
      }

      // 4. Reposts
      const repostsFile = findFile("Your Activity/Reposts.txt") || findFile("Reposts.txt");
      if (repostsFile) {
          const content = await zip.files[repostsFile].async("string");
          const blocks = content.split(/\n\s*\n/).filter(b => b.trim() !== '');
          data.totalReposts = blocks.length;
          
          let earliestDate = Infinity;
          let firstRepost = null;

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
                  if (!isNaN(d.getTime()) && d.getTime() < earliestDate) {
                      earliestDate = d.getTime();
                      firstRepost = { date: dateStr, link: linkStr };
                  }
              }
          });
          data.firstRepost = firstRepost;
      }

      onDataParsed(data);
      onNext();
    } catch (err) {
      console.error(err);
      setError("Failed to parse ZIP. Make sure it's the correct TikTok data export.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "100px 32px 0", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={glassStyle}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>📊</div>
        <h2 style={{ color: "#fff", fontSize: 24, fontWeight: 900, marginBottom: 12 }}>Upload Your Data</h2>
        <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
          Upload your TikTok data `.zip` file to generate your personal Wrapped experience.
        </p>
        <label style={{
            display: "inline-block", background: "#fff", color: "#000",
            padding: "14px 28px", borderRadius: 100, fontWeight: 800, cursor: "pointer",
            transition: "all 0.3s ease",
        }}>
          {loading ? "Processing..." : "Choose ZIP File"}
          <input type="file" accept=".zip" onChange={handleFileUpload} style={{ display: "none" }} disabled={loading} />
        </label>
        {error && <p style={{ color: "#ff5555", fontSize: 12, marginTop: 12 }}>{error}</p>}
      </div>
      <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 32 }}>
        Your data never leaves your device — processing happens entirely in your browser.
      </p>
    </div>
  );
}

function SlideIntro({ data, onNext }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 32px 0" }}>
      <div style={{ fontSize: 64, marginBottom: 16, filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))" }}>🌑</div>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, letterSpacing: 4, textTransform: "uppercase", marginBottom: 20 }}>
        {data.username}
      </p>
      <h1 style={{
        fontSize: 52, fontWeight: 900, lineHeight: 1.05, color: "#fff",
        marginBottom: 24,
      }}>
        Your TikTok<br />Wrapped
      </h1>
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, lineHeight: 1.5, marginBottom: 40 }}>
        A deep dive into your digital footprints,<br />
        <span style={{ color: "#fff", fontWeight: 700 }}>{data.name}</span>
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {[["Comments", data.totalComments], ["Likes", data.totalLikes], ["Following", data.following]].map(([label, val]) => (
          <div key={label} style={{
            background: "rgba(255,255,255,0.05)", borderRadius: 16,
            padding: "16px", border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(10px)", minWidth: 90
          }}>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#fff" }}>{val.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 60 }}>
        <button onClick={onNext} style={{
          background: "rgba(255,255,255,0.1)", color: "#fff",
          border: "1px solid rgba(255,255,255,0.3)", borderRadius: 100, padding: "14px 44px",
          fontSize: 16, fontWeight: 700, cursor: "pointer", backdropFilter: "blur(10px)"
        }}>
          Begin the tour 👁️
        </button>
      </div>
    </div>
  );
}

function SlideStats({ data }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount(c => {
        if (c < data.totalComments) return Math.min(c + Math.ceil(data.totalComments / 50), data.totalComments);
        clearInterval(interval);
        return c;
      });
    }, 20);
    return () => clearInterval(interval);
  }, [data.totalComments]);

  return (
    <div style={{ textAlign: "center", padding: "80px 28px 0" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
        Metrics 🎞️
      </p>
      <h2 style={{ fontSize: 34, fontWeight: 900, color: "#fff", marginBottom: 32, lineHeight: 1.2 }}>
        Your commentary count
      </h2>
      <div style={{ fontSize: 88, fontWeight: 900, color: "#fff", letterSpacing: -2 }}>
        {count.toLocaleString()}
      </div>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 18, marginTop: 8, marginBottom: 40 }}>
        comments dropped 💬
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, maxWidth: 320, margin: "0 auto" }}>
        {[
          { val: data.totalLikes, label: "Videos liked", icon: "🤍" },
          { val: data.following, label: "Following", icon: "➕" },
          { val: 0, label: "Video views", icon: "👁️" },
          { val: 0, label: "Shares", icon: "🔗" },
        ].map(({ val, label, icon }) => (
          <div key={label} style={glassStyle}>
            <div style={{ fontSize: 24 }}>{icon}</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "#fff", marginTop: 6 }}>{val.toLocaleString()}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlideEmoji({ data }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 28px 0" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
        Vibes 🎭
      </p>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", marginBottom: 32 }}>
        Your top reactions
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 300, margin: "0 auto" }}>
        {data.topEmojis.length > 0 ? data.topEmojis.map((e, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 32, width: 40 }}>{e.emoji}</span>
            <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 100, height: 10, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 100,
                background: i === 0 ? "#fff" : "rgba(255,255,255,0.4)",
                width: `${(e.count / data.topEmojis[0].count) * 100}%`,
                transition: "width 1s ease",
              }} />
            </div>
            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, width: 50, textAlign: "right" }}>
              {e.count.toLocaleString()}
            </span>
          </div>
        )) : <p style={{ color: "rgba(255,255,255,0.4)" }}>No emoji data found</p>}
      </div>
    </div>
  );
}

function SlideWords({ data }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 28px 0" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
        Lexicon 🗣️
      </p>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 28 }}>
        Words that defined<br />your TikTok era
      </h2>
      <div style={glassStyle}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          {data.topWords.length > 0 ? data.topWords.map((w, i) => (
            <span key={w} style={{
              fontSize: 24 - i * 2, fontWeight: 700,
              color: i === 0 ? "#fff" : `rgba(255,255,255,${0.9 - i * 0.1})`,
            }}>
              {w}
            </span>
          )) : <p style={{ color: "rgba(255,255,255,0.4)" }}>No word data processed</p>}
        </div>
      </div>
    </div>
  );
}

function SlideBusiest({ data }) {
  return (
    <div style={{ textAlign: "center", padding: "80px 28px 0" }}>
      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>
        Chaos 📅
      </p>
      <h2 style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.2, marginBottom: 24 }}>
        Your most active day
      </h2>
      <div style={{ ...glassStyle, padding: "40px 20px" }}>
        <div style={{ fontSize: 48, fontWeight: 900, color: "#fff" }}>{data.busiestDay}</div>
        <div style={{ fontSize: 20, color: "rgba(255,255,255,0.7)", marginTop: 12 }}>
          <strong>{data.busiestDayCount} comments</strong> in 24h
        </div>
      </div>
    </div>
  );
}

function SlideFinal({ data }) {
  return (
    <div style={{ textAlign: "center", padding: "100px 28px 0", height: "100%" }}>
      <div style={{ fontSize: 64, marginBottom: 24 }}>🏁</div>
      <h2 style={{ fontSize: 40, fontWeight: 900, lineHeight: 1.1, marginBottom: 16, color: "#fff" }}>
        That's a wrap,<br />{data.name}!
      </h2>
      <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 15, lineHeight: 1.6, marginBottom: 40, maxWidth: 300, margin: "0 auto" }}>
        You've dropped {data.totalComments.toLocaleString()} comments and liked {data.totalLikes.toLocaleString()} videos. You define the culture.
      </p>
      <div style={{ ...glassStyle, padding: "20px" }}>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 12 }}>
            Your 2026 TikTok Wrapped
          </div>
          <div style={{ fontSize: 14, color: "#fff", fontWeight: 700, marginBottom: 16 }}>{data.username}</div>
          
          {data.firstRepost && (
            <a 
              href={data.firstRepost.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: "600",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                marginBottom: "8px"
              }}
              onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.15)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.08)"}
            >
              🔄 Your First Repost
            </a>
          )}

          {data.firstLike && (
            <a 
              href={data.firstLike.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                display: "block",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                textDecoration: "none",
                padding: "12px 20px",
                borderRadius: "16px",
                fontSize: "13px",
                fontWeight: "600",
                border: "1px solid rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
                marginBottom: "8px"
              }}
              onMouseOver={(e) => e.target.style.background = "rgba(255,255,255,0.15)"}
              onMouseOut={(e) => e.target.style.background = "rgba(255,255,255,0.08)"}
            >
              🤍 Your First Like
            </a>
          )}

          {data.firstComment && (
            <div style={{
                display: "block",
                background: "rgba(255,255,255,0.05)",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "16px",
                fontSize: "13px",
                textAlign: "left",
                border: "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginBottom: 4 }}>💬 YOUR FIRST COMMENT ({new Date(data.firstComment.date).toLocaleDateString()})</div>
              <div style={{ fontStyle: "italic", fontWeight: 500 }}>"{data.firstComment.text}"</div>
            </div>
          )}
      </div>
      <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
        developed by indaCODEski
      </div>
    </div>
  );
}

// Minimal placeholder slides for required structure
function SlideBestFriend() { return <div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>👯 Slide Coming Soon</div>; }
function SlideFollowing() { return <div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>📱 Slide Coming Soon</div>; }
function SlideJourney() { return <div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>📅 Slide Coming Soon</div>; }
function SlidePersonality() { return <div style={{ color: '#fff', textAlign: 'center', paddingTop: 100 }}>🧛 Slide Coming Soon</div>; }

const SLIDE_COMPONENTS = {
    upload: SlideUpload,
    intro: SlideIntro,
    stats: SlideStats,
    emoji: SlideEmoji,
    bestfriend: SlideBestFriend,
    words: SlideWords,
    busiest: SlideBusiest,
    following: SlideFollowing,
    journey: SlideJourney,
    personality: SlidePersonality,
    final: SlideFinal,
};

export default function TikTokWrapped() {
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState(DEFAULT_DATA);
  const touchStart = useRef(null);

  const goNext = () => { if (current < SLIDES.length - 1) setCurrent(c => c + 1); };
  const goPrev = () => { if (current > 0) setCurrent(c => c - 1); };

  const handleTouch = (e) => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (!touchStart.current) return;
    const dx = touchStart.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 40) { dx > 0 ? goNext() : goPrev(); }
    touchStart.current = null;
  };

  const currentSlide = SLIDES[current];
  const SlideComponent = SLIDE_COMPONENTS[currentSlide.id];
  const [c1, c2] = COLORS[current % COLORS.length];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#000", fontFamily: "'Outfit', 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{ 
        position: "relative", width: 390, height: 720, overflow: "hidden", 
        borderRadius: 40, border: "8px solid #111", boxShadow: "0 0 100px rgba(255,255,255,0.05)" 
      }}>
        {/* Background gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(160deg, ${c1} 0%, #000 70%, ${c2} 100%)`,
          transition: "background 1s ease",
        }} />

        <ProgressBar current={current} total={SLIDES.length} />

        {/* Tap zones */}
        <div
          style={{ position: "absolute", inset: 0, zIndex: 50, display: "flex" }}
          onTouchStart={handleTouch}
          onTouchEnd={handleTouchEnd}
        >
          <div style={{ flex: 1, cursor: "pointer" }} onClick={goPrev} />
          <div style={{ flex: 1, cursor: "pointer" }} onClick={goNext} />
        </div>

        {/* Slide content */}
        <div style={{ position: "relative", zIndex: 10, height: "100%", overflowY: "auto" }}>
          <SlideComponent 
            data={data} 
            onDataParsed={(d) => setData(d)} 
            onNext={goNext} 
            onPrev={goPrev} 
          />
        </div>

        {/* Slide counter */}
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          color: "rgba(255,255,255,0.2)", fontSize: 10, zIndex: 60, fontWeight: 700
        }}>
          {current + 1} / {SLIDES.length}
        </div>
      </div>
    </div>
  );
}
