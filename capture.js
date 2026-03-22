const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Set modern viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    const url = 'http://localhost:8000/index.html';
    console.log(`Navigating to ${url}...`);

    try {
        await page.goto(url, { waitUntil: 'networkidle' });

        // Ensure screenshots directory exists
        const outDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir);
        }

        // --- Slide 1 ---
        console.log("Capturing Slide 1...");
        await page.waitForTimeout(1000); // Wait for animations
        await page.screenshot({ path: path.join(outDir, 'slide-1.png') });

        // Click Let's Go
        await page.click('text="Let\'s Go"');

        // --- Slide 2 ---
        console.log("Capturing Slide 2...");
        await page.waitForTimeout(2500); // Wait for number animations
        await page.screenshot({ path: path.join(outDir, 'slide-2.png') });

        // Click Next
        await page.click('text="Next"');

        // --- Slide 3 ---
        console.log("Capturing Slide 3...");
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(outDir, 'slide-3.png') });

        // Click Next
        await page.click('text="Next"');

        // --- Slide 4 ---
        console.log("Capturing Slide 4...");
        await page.waitForTimeout(2500);
        await page.screenshot({ path: path.join(outDir, 'slide-4.png') });

        // Click See your firsts
        await page.click('text="See your firsts"');

        // --- Slide 5 ---
        console.log("Capturing Slide 5...");
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(outDir, 'slide-5.png') });

        // Click Finish
        await page.click('text="Finish"');

        // --- Slide 6 ---
        console.log("Capturing Slide 6...");
        await page.waitForTimeout(1500);
        await page.screenshot({ path: path.join(outDir, 'slide-6.png') });

        console.log("All slides captured successfully!");
    } catch (e) {
        console.error("Error generating screenshots:", e);
    } finally {
        await browser.close();
    }
})();
