// TizenTube - correctif "vidéo figée" après extinction/rallumage (fix4)
(function () {
    const TICK_MS = 2000;
    const STALL_MS = 10000;
    let hiddenAt = 0;
    let lastTime = -1;
    let stalledSince = 0;
    let reloading = false;

    function log(msg) {
        try {
            const l = JSON.parse(localStorage.getItem('ttFixLog') || '[]');
            const d = new Date();
            l.push(d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2) + ' ' + msg);
            localStorage.setItem('ttFixLog', JSON.stringify(l.slice(-6)));
        } catch (e) {}
    }

    function toast(msg, ms) {
        try {
            const d = document.createElement('div');
            d.textContent = msg;
            d.style.cssText = 'position:fixed;top:5vh;left:50%;transform:translateX(-50%);' +
                'z-index:999999;background:rgba(0,0,0,.85);color:#fff;font-size:2.5vh;' +
                'padding:1.5vh 3vh;border-radius:1vh;white-space:pre-line;';
            document.body.appendChild(d);
            if (ms) setTimeout(function () { d.remove(); }, ms);
        } catch (e) {}
    }

    function reload(reason) {
        if (reloading) return;
        reloading = true;
        log('reload: ' + reason);
        toast('Rechargement…');
        setTimeout(function () { location.reload(); }, 300);
    }

    function canStallReload() {
        let l = [];
        try { l = JSON.parse(sessionStorage.getItem('ttStall') || '[]'); } catch (e) {}
        const now = Date.now();
        l = l.filter(function (t) { return now - t < 300000; });
        if (l.length >= 2) return false;
        l.push(now);
        try { sessionStorage.setItem('ttStall', JSON.stringify(l)); } catch (e) {}
        return true;
    }

    function releasePlayer() {
        try {
            const v = document.querySelector('video');
            if (!v) { log('pas de video'); return; }
            v.pause();
            v.removeAttribute('src');
            v.load();
            log('lecteur libere');
        } catch (e) { log('liberation ERREUR: ' + (e && e.message ? e.message : e)); }
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            hiddenAt = Date.now();
            log('cachee');
            releasePlayer();
        } else {
            log('visible');
            if (hiddenAt && Date.now() - hiddenAt > 2000) reload('rallumage');
        }
    });

    function showDiag() {
        let l = [];
        try { l = JSON.parse(localStorage.getItem('ttFixLog') || '[]'); } catch (e) {}
        toast('Correctif actif (fix4)\n' + (l.length ? l.join('\n') : 'aucun evenement'), 8000);
        log('demarrage');
    }
    if (document.body) showDiag(); else document.addEventListener('DOMContentLoaded', showDiag);

    setInterval(function () {
        if (document.hidden) return;
        const now = Date.now();
        const v = document.querySelector('video');
        if (!v || v.paused || v.ended || !v.currentSrc) { lastTime = -1; stalledSince = 0; return; }
        if (v.currentTime !== lastTime) { lastTime = v.currentTime; stalledSince = 0; return; }
        if (!stalledSince) stalledSince = now;
        else if (now - stalledSince > STALL_MS && canStallReload()) reload('video bloquee');
    }, TICK_MS);
})();
