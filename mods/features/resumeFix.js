// TizenTube - correctif "vidéo figée" (après extinction/rallumage de la TV)
// 1) Recharge si la TV sort de veille (visibilitychange / trou dans le minuteur)
// 2) Recharge si une vidéo est en lecture mais n'avance plus pendant 10 s
// Sécurité : 2 rechargements max par tranche de 5 min (évite une boucle).
(function () {
    const SLEEP_MS = 30000;      // veille > 30 s
    const TICK_MS = 2000;        // vérification toutes les 2 s
    const STALL_MS = 10000;      // vidéo bloquée depuis 10 s
    const WINDOW_MS = 300000;    // fenêtre anti-boucle : 5 min
    const MAX_RELOADS = 2;

    let hiddenAt = 0;
    let lastTick = Date.now();
    let lastTime = -1;
    let stalledSince = 0;
    let reloading = false;

    function toast(msg) {
        try {
            const d = document.createElement('div');
            d.textContent = msg;
            d.style.cssText = 'position:fixed;top:5vh;left:50%;transform:translateX(-50%);' +
                'z-index:999999;background:rgba(0,0,0,.85);color:#fff;font-size:2.5vh;' +
                'padding:1.5vh 3vh;border-radius:1vh;';
            document.body.appendChild(d);
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
        if (!canReload()) { console.log('[TizenTube resumeFix] limite atteinte: ' + reason); return; }
        reloading = true;
        console.log('[TizenTube resumeFix] reload: ' + reason);
        toast('Vidéo bloquée - rechargement…');
        setTimeout(function () { location.reload(); }, 1000);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) hiddenAt = Date.now();
        else if (hiddenAt && Date.now() - hiddenAt > SLEEP_MS) reload('visibilitychange');
    });

    setInterval(function () {
        const now = Date.now();
        if (now - lastTick > SLEEP_MS) reload('timer gap');
        lastTick = now;

        const v = document.querySelector('video');
        if (!v || v.paused || v.ended || !v.currentSrc) { lastTime = -1; stalledSince = 0; return; }
        if (v.currentTime !== lastTime) { lastTime = v.currentTime; stalledSince = 0; return; }
        if (!stalledSince) stalledSince = now;
        else if (now - stalledSince > STALL_MS) reload('video stalled at ' + v.currentTime);
    }, TICK_MS);
})();
