(function () {
    // Skip if page already has its own full starfield canvas
    if (document.getElementById('otc-stars-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.id = 'otc-stars-canvas';
    Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: '-1'
    });

    document.body.prepend(canvas);

    // Ensure main content stays cleanly above the starfield
    const style = document.createElement('style');
    style.textContent = `
        header, main, footer, .container, .main-card, .tool-card, .info-card, .content-card {
            position: relative;
            z-index: 1;
        }
    `;
    document.head.appendChild(style);

    const ctx = canvas.getContext('2d');
    let stars = [];
    const STAR_COUNT = 160;

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function initStars() {
        stars = [];
        for (let i = 0; i < STAR_COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.4,
                alpha: Math.random() * 0.8 + 0.2,
                delta: (Math.random() * 0.015 + 0.004) * (Math.random() < 0.5 ? 1 : -1),
                driftY: Math.random() * 0.12 + 0.03
            });
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < stars.length; i++) {
            const s = stars[i];
            s.alpha += s.delta;
            if (s.alpha >= 1 || s.alpha <= 0.15) s.delta = -s.delta;

            s.y -= s.driftY;
            if (s.y < 0) {
                s.y = canvas.height;
                s.x = Math.random() * canvas.width;
            }

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(226, 232, 240, ${s.alpha.toFixed(2)})`;
            ctx.fill();
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', () => {
        resize();
        initStars();
    });

//     resize();
//     initStars();
//     animate();
// })();
    resize();
    initStars();
    animate();

//     // Ensure every tool page has the "100% Private • Secure Conversion" pill right above <h1>
//     const h1 = document.querySelector('main h1, .main-card h1, .tool-card h1, .hero h1, h1');
//     if (h1) {
//         const existingPill = document.querySelector('.status-pill, .privacy-pill, [class*="pill"]');
//         if (existingPill && /private|client-side|server-side|secure/i.test(existingPill.textContent)) {
//             existingPill.className = 'otc-private-pill';
//             existingPill.innerHTML = '🔒 100% Private &bull; Secure Conversion';
//         } else if (!document.querySelector('.otc-private-pill')) {
//             const wrap = document.createElement('div');
//             wrap.className = 'otc-private-pill-wrap';
//             wrap.innerHTML = '<div class="otc-private-pill">🔒 100% Private &bull; Secure Conversion</div>';
//             h1.parentNode.insertBefore(wrap, h1);
//         }
//     }
// })();

//     function applyConsistentPrivacyPill() {
//         const h1 = document.querySelector('main h1, .main-card h1, .tool-card h1, .hero h1, h1');
//         if (!h1) return;

//         // Check if an existing pill/badge already sits near <h1>
//         const searchRoot = h1.closest('.hero, .tool-card, .main-card, main, section') || h1.parentElement;
//         const candidates = searchRoot ? searchRoot.querySelectorAll('div, span, p') : [];
//         let updatedExisting = false;

//         for (const el of candidates) {
//             if (el === h1 || el.contains(h1)) continue;
//             const txt = el.textContent.trim();
//             if (txt.length > 0 && txt.length < 70 && /100%|private|client-side|server-side|secure conversion|zero server/i.test(txt)) {
//                 el.className = 'otc-private-pill';
//                 el.innerHTML = '🔒 100% Private &bull; Secure Conversion';
//                 updatedExisting = true;
//                 break;
//             }
//         }

//         if (!updatedExisting && !document.querySelector('.otc-private-pill')) {
//             const wrap = document.createElement('div');
//             wrap.className = 'otc-private-pill-wrap';
//             wrap.innerHTML = '<div class="otc-private-pill">🔒 100% Private &bull; Secure Conversion</div>';
//             h1.parentNode.insertBefore(wrap, h1);
//         }
//     }

//     if (document.readyState === 'loading') {
//         document.addEventListener('DOMContentLoaded', applyConsistentPrivacyPill);
//     } else {
//         applyConsistentPrivacyPill();
//     }
// })();
    function applyConsistentPrivacyPill() {
        const h1 = document.querySelector('main h1, .main-card h1, .tool-card h1, .hero h1, h1');
        if (!h1) return;

        const pillHTML = '🔒 100% Client-Side &bull; Zero Server Uploads';

        // Check if an existing pill/badge already sits near <h1>
        const searchRoot = h1.closest('.hero, .tool-card, .main-card, main, section') || h1.parentElement;
        const candidates = searchRoot ? searchRoot.querySelectorAll('div, span, p') : [];
        let updatedExisting = false;

        for (const el of candidates) {
            if (el === h1 || el.contains(h1)) continue;
            const txt = el.textContent.trim();
            if (txt.length > 0 && txt.length < 70 && /100%|private|client-side|server-side|secure|zero server/i.test(txt)) {
                el.className = 'otc-private-pill';
                el.innerHTML = pillHTML;
                updatedExisting = true;
                break;
            }
        }

        if (!updatedExisting && !document.querySelector('.otc-private-pill')) {
            const wrap = document.createElement('div');
            wrap.className = 'otc-private-pill-wrap';
            wrap.innerHTML = `<div class="otc-private-pill">${pillHTML}</div>`;
            h1.parentNode.insertBefore(wrap, h1);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyConsistentPrivacyPill);
    } else {
        applyConsistentPrivacyPill();
    }
})();

// Polyfill crypto.randomUUID for mobile testing over local HTTP IP addresses
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
    crypto.randomUUID = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    };
}

// Prevent iOS Safari "WebKitBlobResource error 1" by delaying blob URL revocation
if (typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
    const origRevoke = URL.revokeObjectURL.bind(URL);
    URL.revokeObjectURL = function (url) {
        setTimeout(() => origRevoke(url), 60000);
    };
}


