export function enforceAuth() {
    const user = localStorage.getItem("loggedInUser");
    const sessionStart = parseInt(localStorage.getItem("sessionStart"), 10);
    const maxSessionLength = 1000 * 60 * 30; // 30 minutes

    const expired = !sessionStart || Date.now() - sessionStart > maxSessionLength;

    if (!user || expired) {
        localStorage.clear(); // clear session
        window.location.replace("/login&create/index.html"); // redirect securely
    }
}
