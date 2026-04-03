const profileForm = document.getElementById('profileForm');
const logoutLink = document.getElementById('logoutLink');

// Profile picture elements
const profilePicture = document.getElementById('profilePicture');
const avatarInput = document.getElementById('avatarInput');
const avatarFormInput = document.getElementById('avatarFormInput');
let selectedFile = null;

// Handle profile picture click
function handleProfilePictureClick() {
    avatarInput.click();
}

// Add click listeners for profile picture
profilePicture.addEventListener('click', handleProfilePictureClick);

// Handle file selection (matching login pattern)
avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        selectedFile = file;
        // Create preview (matching login pattern)
        profilePicture.src = URL.createObjectURL(file);

        // Copy file to form input for submission
        const dt = new DataTransfer();
        dt.items.add(file);
        avatarFormInput.files = dt.files;
    } else {
        // Show default avatar instead
        profilePicture.src = '/avatars/default-avatar.png';
    }
});

// Update achievements display with real data
function updateAchievementsDisplay(achievements) {
    const achievementsList = document.querySelector('.achievement-list');
    if (!achievementsList) return;

    achievementsList.innerHTML = achievements.map((achievement) => `
        <div class="achievement ${achievement.completed ? 'completed' : 'incomplete'}">
            <span class="achievement-icon">${achievement.icon}</span>
            <div class="achievement-details">
                <span class="achievement-name">${achievement.name}</span>
                <span class="achievement-description">${achievement.description}</span>
                ${achievement.target > 1 ? `
                    <div class="achievement-progress">
                        Progress: ${achievement.progress}/${achievement.target}
                    </div>
                ` : ''}
            </div>
            <span class="achievement-status">${achievement.completed ? '✓' : '○'}</span>
        </div>
    `).join('');
}

// Load existing user data into the form
function loadUserProfile() {
    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', '/users/profile');
    xhttp.onload = () => {
        if (xhttp.status === 200) {
            const userData = JSON.parse(xhttp.responseText);
            // Fill in the form with current user data
            document.getElementById('username').value = userData.username;
            document.getElementById('email').value = userData.email || '';

            // Use the same fallback logic as Vue.js main page
            const avatarPath = userData.avatar_path || '/images/avatars/default-avatar.png';

            // Handle different avatar path formats
            let avatarSrc;
            if (avatarPath.startsWith('/avatars/')) {
                avatarSrc = avatarPath;
            } else if (avatarPath.startsWith('/images/avatars/')) {
                avatarSrc = avatarPath.replace('/images/avatars/', '/avatars/');
            } else {
                avatarSrc = `/avatars/${avatarPath}`;
            }

            profilePicture.src = avatarSrc;
            console.log('Loading avatar:', avatarSrc);
        } else {
            alert('Error loading profile data. Please log in again.');
            window.location.href = '/login.html';
        }
    };
    xhttp.onerror = () => {
        alert('Network error loading profile');
    };
    xhttp.send();
}

// Load achievements from backend
function loadAchievements() {
    const xhttp = new XMLHttpRequest();
    xhttp.open('GET', '/achievements');
    xhttp.onload = () => {
        if (xhttp.status === 200) {
            const data = JSON.parse(xhttp.responseText);
            updateAchievementsDisplay(data.achievements);
        } else {
            console.error('Error loading achievements');
        }
    };
    xhttp.onerror = () => {
        console.error('Network error loading achievements');
    };
    xhttp.send();
}

// Handle profile form submission (updated for file uploads)
profileForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(profileForm);

    if (selectedFile) {
        formData.set('avatar', selectedFile);
    }

    if (!formData.get('newPassword')) {
        formData.delete('newPassword');
    }

    const xhttp = new XMLHttpRequest();
    xhttp.open('PUT', '/users/profile');
    xhttp.onload = () => {
        const result = JSON.parse(xhttp.responseText);
        alert(result.message || result.error);

        if (result.message) {
            // Success - clear the password fields for security
            document.getElementById('currentPassword').value = '';
            document.getElementById('newPassword').value = '';
            // Clear selected file
            selectedFile = null;
            avatarInput.value = '';
            avatarFormInput.value = '';
            // Reload the profile data
            loadUserProfile();
            loadAchievements();
        }
    };
    xhttp.onerror = () => {
        alert('Network error during profile update');
    };
    xhttp.send(formData);
});

// Handle logout
logoutLink.addEventListener('click', (e) => {
    e.preventDefault();
    const xhttp = new XMLHttpRequest();
    xhttp.open('POST', '/users/logout');
    xhttp.onload = () => {
        window.location.href = '/login.html';
    };
    xhttp.send();
});

// Load functions when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile();
    loadAchievements();
});