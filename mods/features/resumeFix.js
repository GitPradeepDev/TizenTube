// Recharge YouTube après une mise en veille de la TV (évite l'écran figé au rallumage).
(function () {
    const MIN_SLEEP_MS = 30000; // veille de plus de 30 s => rechargement
    const TICK_MS = 5000;
    let hiddenAt = 0;
    let lastTick = Date.now();
    let reloading = false;

    function reload(reason) {
        if (reloading) return;
        reloading = true;
        console.log('[TizenTube resumeFix] reload: ' + reason);
        setTimeout(function () { location.reload(); }, 500);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.hidden) {
            hiddenAt = Date.now();
        } else if (hiddenAt && Date.now() - hiddenAt > MIN_SLEEP_MS) {
            reload('visibilitychange');
        }
    });

    // Pendant la veille, le JavaScript est suspendu : un "trou" dans ce minuteur = TV rallumée
    setInterval(function () {
        const now = Date.now();
        if (now - lastTick > MIN_SLEEP_MS) reload('timer gap ' + (now - lastTick) + ' ms');
        lastTick = now;
    }, TICK_MS);
})();
