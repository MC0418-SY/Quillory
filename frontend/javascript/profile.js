document.addEventListener('DOMContentLoaded', () => {
    // Redirect to login if not authenticated
    const userId = localStorage.getItem('user_id');
    if (!userId) {
        window.location.href = 'login.html';
    }

    const postsFeed = document.getElementById('profilePostsFeed');
    const logoutBtn = document.querySelector('.logout-btn');
    const profileImg = document.querySelector('.profile-img'); // Selects the main profile card image
    const fileInput = document.querySelector('.account-settings-fileinput');
    const saveChangesBtn = document.querySelector('.save-changes-btn');

    // Form Inputs
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const bioInput = document.getElementById('bio');
    const fbInput = document.getElementById('facebook_url');
    const twInput = document.getElementById('twitter_url');
    const igInput = document.getElementById('instagram_url');
    const liInput = document.getElementById('linkedin_url');

        // 1. Load User Data and Populate Form
    async function loadUserData() {
        try {
            const res = await fetch(`https://quillory.onrender.com/api/users/${userId}`);
            const result = await res.json();
            if (result.success) {
                const u = result.data;
                
                // If we got a URL back from the DB, display it
                if (u.avatar_url) {
                    profileImg.src = `https://quillory.onrender.com${u.avatar_url}?t=${new Date().getTime()}`;
                } else {
                    // Use inline SVG as fallback instead of via.placeholder.com
                    profileImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><rect width='120' height='120' fill='%23e0e0e0'/><circle cx='60' cy='50' r='25' fill='%23a0a0a0'/><path d='M15 120 a45 45 0 0 1 90 0' fill='%23a0a0a0'/></svg>";
                }

                usernameInput.value = u.username || '';
                emailInput.value = u.email || '';
                bioInput.value = u.bio_description || '';
                fbInput.value = u.facebook_url || '';
                twInput.value = u.twitter_url || '';
                igInput.value = u.instagram_url || '';
                liInput.value = u.linkedIn_url || '';
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // 2. Handle Save Changes Click
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', async () => {
            const updatedUser = {
                username: usernameInput.value,
                bio_description: bioInput.value,
                facebook_url: fbInput.value,
                twitter_url: twInput.value,
                instagram_url: igInput.value,
                linkedIn_url: liInput.value
            };

            try {
                const res = await fetch(`https://quillory.onrender.com/api/users/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedUser)
                });
                const result = await res.json();
                
                if (result.success) {
                    showCustomAlert('Profile updated successfully!');
                } else {
                    showCustomAlert(result.message || 'Failed to update profile.', 'error');
                }
            } catch (error) {
                console.error('Error updating profile:', error);
                showCustomAlert('Failed to connect to server.', 'error');
            }
        });
    }

        // 3. Handle Profile Picture Upload
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 2 * 1024 * 1024) {
                    return showCustomAlert('File is too large! Maximum size is 2MB.', 'error');
                }

                const formData = new FormData();
                formData.append('avatar', file);

                try {
                    const res = await fetch(`https://quillory.onrender.com/api/users/${userId}/avatar`, {
                        method: 'PUT',
                        body: formData
                    });
                    const result = await res.json();
                    
                    if (result.success) {
                        // Immediately update the image on the screen
                        profileImg.src = `https://quillory.onrender.com${result.avatar_url}?t=${new Date().getTime()}`;
                        showCustomAlert('Profile picture updated!');
                    } else {
                        showCustomAlert(result.message || 'Failed to upload picture.', 'error');
                    }
                } catch (error) {
                    console.error('Error uploading picture:', error);
                    showCustomAlert('Failed to connect to server.', 'error');
                }
            }
        });
    }

    // 4. Load User's Posts
    async function loadProfilePosts() {
        try {
            const response = await fetch(`https://quillory.onrender.com/api/posts?userId=${userId}`);
            const result = await response.json();

            if (result.success && result.data.length > 0) {
                postsFeed.innerHTML = '';
                result.data.forEach(post => {
                    const postCard = document.createElement('div');
                    postCard.className = 'post-card';
                    
                    postCard.innerHTML = `
                        <h3 class="post-title">${post.title}</h3>
                        <div class="post-meta">
                            <span>Published on ${new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                        <div class="post-content">${post.content_description}</div>
                        <p class="post-tags"><em>Tags: ${post.tags.join(', ') || 'None'}</em></p>
                        <div class="post-actions">
                            <button class="edit-post" data-id="${post.post_id}">Edit</button>
                            <button class="delete-published" data-id="${post.post_id}">Delete</button>
                        </div>
                    `;
                    postsFeed.appendChild(postCard);
                });

                document.querySelectorAll('.edit-post').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        window.location.href = `edit.html?id=${e.target.getAttribute('data-id')}`;
                    });
                });

                document.querySelectorAll('.delete-published').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const postId = e.target.getAttribute('data-id');
                        if (confirm('Are you sure you want to delete this post?')) {
                            await fetch(`https://quillory.onrender.com/api/posts/${postId}`, { method: 'DELETE' });
                            loadProfilePosts();
                        }
                    });
                });
            } else {
                postsFeed.innerHTML = '<p>You haven\'t published any posts yet.</p>';
            }
        } catch (error) {
            console.error('Error fetching profile posts:', error);
        }
    }

    // 5. Handle Log Out Click
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user_id');
            showCustomAlert('Logging out...');
            setTimeout(() => {
                window.location.href = 'login.html'; 
            }, 1000);
        });
    }

    // Initial Loads
    loadUserData();
    loadProfilePosts();
});