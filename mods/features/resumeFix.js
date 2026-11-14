// TizenTube - correctif "vidéo figée" + diagnostic (fix3)
(function () {
    const SLEEP_MS = 30000;
    const TICK_MS = 2000;
    const STALL_MS = 10000;
    const WINDOW_MS = 300000;
    const MAX_RELOADS = 2;

    let hiddenAt = 0;
    let lastTick = Date.now();
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
                'padding:1.5vh 3vh;border-radius:1vh;';
            d.style.whiteSpace = 'pre-line';
            document.body.appendChild(d);
            if (ms) setTimeout(function () { d.remove(); }, ms);
        } catch (e) {}
    }

    function canReload() {
        let list = [];
        try { list = JSON.parse(sessionStorage.getItem('ttResumeFix') || '[]'); } catch (e) {}
        const now = Date.now();
        list = list.filter(function (t) { return now - t < WINDOW_MS; });
        if (list.length >= MAX_RELOADS) return false;
        list.push(now);
        try { sessionStorage.setItem('ttResumeFix', JSON.stringify(list)); } catch (e) {}
        return true;
    }

    function reload(reason) {
        if (reloading) return;
        if (!canReload()) return;
        reloading = true;
        log('reload: ' + reason);
        toast('Vidéo bloquée - rechargement…');
        setTimeout(function () { location.reload(); }, 1000);
    }

    function exitApp() {
        try { tizen.application.getCurrentApplication().exit(); log('exit OK'); return true; }
        catch (e) { log('exit ERREUR: ' + (e && e.message ? e.message : e)); }
        try { window.close(); } catch (e) {}
        return false;
    }

    document.addEventListener('visibilitychange', function () {
        log('visibilite: ' + (document.hidden ? 'cachee' : 'visible'));
        if (document.hidden) {
            hiddenAt = Date.now();
            exitApp();
        } else if (hiddenAt && Date.now() - hiddenAt > SLEEP_MS) {
            reload('visibilitychange');
        }
    });

    function showDiag() {
        let l = [];
        try { l = JSON.parse(localStorage.getItem('ttFixLog') || '[]'); } catch (e) {}
        toast('Correctif actif (fix3)\n' + (l.length ? l.join('\n') : 'aucun evenement'), 15000);
        log('demarrage');
    }
    if (document.body) showDiag(); else document.addEventListener('DOMContentLoaded', showDiag);

    setInterval(function () {
        const now = Date.now();
        if (now - lastTick > SLEEP_MS) reload('timer gap');
        lastTick = now;

        const v = document.querySelector('video');
        if (!v || v.paused || v.ended || !v.currentSrc) { lastTime = -1; stalledSince = 0; return; }
        if (v.currentTime !== lastTime) { lastTime = v.currentTime; stalledSince = 0; return; }
        if (!stalledSince) stalledSince = now;
        else if (now - stalledSince > STALL_MS) reload('video bloquee a ' + Math.round(v.currentTime) + 's');
    }, TICK_MS);
})();
