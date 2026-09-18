// Toast Notification System
function showCustomAlert(message, type = 'success') {
    let container = document.getElementById('toast-container');
    
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => { toast.classList.add('show'); }, 10);

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => { toast.remove(); }, 300);
    }, 3000);
}

// Load User Avatar in Header (Runs on all pages)
async function loadHeaderAvatar() {
    const userId = localStorage.getItem('user_id');
    const headerImg = document.getElementById('header-profile-img');
    
    if (userId && headerImg) {
        try {
            const res = await fetch(`https://quillory.onrender.com/api/users/${userId}`);
            const result = await res.json();
            
            // Check if they have a real uploaded avatar (stored in /uploads/)
            if (result.success && result.data.avatar_url && result.data.avatar_url.startsWith('/uploads/')) {
                headerImg.src = `https://quillory.onrender.com${result.data.avatar_url}?t=${new Date().getTime()}`;
            }
        } catch (error) {
            console.error('Error loading header avatar:', error);
        }
    }
}

// Run the function when the script loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeaderAvatar);
} else {
    loadHeaderAvatar();
}