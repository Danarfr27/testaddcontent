// Redirect to login if not authenticated
(function () {

    // Immediate redirection if auth shim is missing
    if (!window.auth) {
        window.location.href = '/login.html';
        return;
    }

    // Check auth status
    auth.isAuthenticated().then(valid => {
        if (!valid) {
            window.location.href = '/login.html';
        } else {
            // Auth success: Reveal the app
            document.body.style.display = 'block';
            document.body.style.opacity = '1';
            document.body.style.pointerEvents = 'auto';
        }
    }).catch((e) => {
        console.error("Auth Exception:", e);
        window.location.href = '/login.html';
    });

})();
