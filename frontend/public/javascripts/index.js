// Background management for session persistence
document.addEventListener('DOMContentLoaded', function () {
    loadBackgroundFromSession();
});

function loadBackgroundFromSession() {
    fetch('/background', {
        method: 'GET',
        credentials: 'include'
    })
        .then(response => response.json())
        .then(data => {
            if (data.background !== undefined) {
                setBackgroundTheme(data.background);
            }
        })
        .catch(error => {
            console.error('Error loading background from session:', error);
        });
}

function setBackgroundTheme(themeId) {
    const themes = [
        {
            id: 0,
            name: 'Sunset',
            background: '/images/backgrounds/sunset1.png'
        },
        {
            id: 1,
            name: 'Japanese Dark',
            background: '/images/backgrounds/japanese-dark.jpg'
        },
        {
            id: 2,
            name: 'Japanese Light',
            background: '/images/backgrounds/japanese-light.png'
        }
    ];

    if (themeId >= 0 && themeId < themes.length) {
        document.body.style.backgroundImage = `url(${themes[themeId].background})`;
    }
}

function saveBackgroundToSession(themeId) {
    fetch('/background', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ background: themeId })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Background saved to session:', themeId);
            }
        })
        .catch(error => {
            console.error('Error saving background to session:', error);
        });
}

// Make functions available globally
window.loadBackgroundFromSession = loadBackgroundFromSession;
window.setBackgroundTheme = setBackgroundTheme;
window.saveBackgroundToSession = saveBackgroundToSession;
