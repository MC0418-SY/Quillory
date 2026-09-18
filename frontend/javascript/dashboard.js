document.addEventListener('DOMContentLoaded', () => {
    const postsFeed = document.getElementById('postsFeed');
    const recencyFilter = document.getElementById('recency-filter');
    const categoryFilter = document.getElementById('category-filter');
    const featuredFilter = document.getElementById('featured-filter');
    const searchBar = document.getElementById('search-bar');

    let allPosts = []; 

    // Modal Elements
    const modal = document.getElementById('author-modal');
    const modalAvatar = document.getElementById('modal-avatar');
    const modalUsername = document.getElementById('modal-username');
    const modalBio = document.getElementById('modal-bio');
    const modalSocials = document.getElementById('modal-socials');
    const modalCloseBtn = document.querySelector('.modal-close-btn');

    // Attach event listeners
    recencyFilter.addEventListener('change', applyFilters);
    categoryFilter.addEventListener('change', applyFilters);
    if (featuredFilter) featuredFilter.addEventListener('change', applyFilters);
    if (searchBar) searchBar.addEventListener('input', applyFilters);

    const newPostBtn = document.querySelector('.new-post-btn');
    if (newPostBtn) {
        newPostBtn.addEventListener('click', () => window.location.href = 'post.html');
    }

    // Close modal events
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => modal.style.display = 'none');
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    async function fetchPosts() {
        try {
            const response = await fetch('https://quillory.onrender.com/api/posts');
            const result = await response.json();

            if (result.success) {
                allPosts = result.data;
                populateCategoryFilter();
                applyFilters();
            } else {
                postsFeed.innerHTML = '<p>No posts yet. Be the first to write!</p>';
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
            postsFeed.innerHTML = '<p style="color: red;">Failed to load posts. Is the server running?</p>';
        }
    }

    function populateCategoryFilter() {
        const allTags = new Set();
        allPosts.forEach(post => {
            post.tags.forEach(tag => allTags.add(tag));
        });

        categoryFilter.innerHTML = '<option value="all">All Categories</option>';
        Array.from(allTags).sort().forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            categoryFilter.appendChild(option);
        });
    }

    function applyFilters() {
        let postsToDisplay = [...allPosts];
        const searchQuery = searchBar.value.toLowerCase().trim();

        if (searchQuery) {
            postsToDisplay = postsToDisplay.filter(post => 
                post.title.toLowerCase().includes(searchQuery) ||
                post.content_description.toLowerCase().includes(searchQuery) ||
                post.author.toLowerCase().includes(searchQuery)
            );
        }

        const selectedCategory = categoryFilter.value;
        if (selectedCategory !== 'all') {
            postsToDisplay = postsToDisplay.filter(post => post.tags.includes(selectedCategory));
        }

        if (recencyFilter.value === 'oldest') {
            postsToDisplay.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } else {
            postsToDisplay.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        renderPosts(postsToDisplay);
    }

    function renderPosts(posts) {
        postsFeed.innerHTML = ''; 
        
        if (posts.length === 0) {
            postsFeed.innerHTML = '<p>No posts match this filter.</p>';
            return;
        }

        posts.forEach(post => {
            const postCard = document.createElement('div');
            postCard.className = 'post-card'; 
            
            postCard.innerHTML = `
                <h3 class="post-title">${post.title}</h3>
                <div class="post-meta">
                    <!-- Author is now a button -->
                    <button class="author-link" data-user-id="${post.user_id}">By: ${post.author}</button>
                    <span>${new Date(post.created_at).toLocaleDateString()}</span>
                </div>
                <div class="post-content">${post.content_description}</div>
                <p class="post-tags"><em>Tags: ${post.tags.join(', ') || 'None'}</em></p>
            `;
            postsFeed.appendChild(postCard);
        });

        // Attach event listeners to the author buttons
        document.querySelectorAll('.author-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const userId = e.target.getAttribute('data-user-id');
                showAuthorModal(userId);
            });
        });
    }

    // Function to fetch author data and show modal
    async function showAuthorModal(userId) {
        try {
            const res = await fetch(`https://quillory.onrender.com/api/users/${userId}`);
            const result = await res.json();
            
            if (result.success) {
                const user = result.data;
                // Set Avatar or default
                modalAvatar.src = user.avatar_url ? `https://quillory.onrender.com${user.avatar_url}?t=${new Date().getTime()}` : 'pf.jpg';
                
                // Set Username and Bio
                modalUsername.innerText = user.username;
                modalBio.innerText = user.bio_description || 'No bio available.';
                
                // Set Socials
                let socialsHTML = '';
                if (user.facebook_url) socialsHTML += `<a href="${user.facebook_url}" target="_blank">Facebook</a>`;
                if (user.twitter_url) socialsHTML += `<a href="${user.twitter_url}" target="_blank">Twitter</a>`;
                if (user.instagram_url) socialsHTML += `<a href="${user.instagram_url}" target="_blank">Instagram</a>`;
                if (user.linkedIn_url) socialsHTML += `<a href="${user.linkedIn_url}" target="_blank">LinkedIn</a>`;
                
                modalSocials.innerHTML = socialsHTML || '<span>No social links provided.</span>';
                
                modal.style.display = 'flex'; // Show modal
            } else {
                showCustomAlert('Failed to load author details.', 'error');
            }
        } catch (error) {
            console.error('Error fetching author:', error);
            showCustomAlert('Failed to load author details.', 'error');
        }
    }

    // Initial load
    fetchPosts();
});