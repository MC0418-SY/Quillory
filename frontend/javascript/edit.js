// Redirect to login if not authenticated
const userId = localStorage.getItem('user_id');
if (!userId) {
    window.location.href = 'login.html';
}

let quill;
let postId;

// Wait for DOM to load before initializing Quill
document.addEventListener('DOMContentLoaded', () => {

    // 1. Initialize Quill
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                [{ indent: '-1' }, { indent: '+1' }],
                ['link', 'image'],
                ['clean']
            ]
        }
    });

    // 2. Get Post ID from URL (?id=1)
    const urlParams = new URLSearchParams(window.location.search);
    postId = urlParams.get('id');

    if (postId) {
        loadPost();
    } else {
        showCustomAlert('No post ID found in URL!', 'error');
        window.location.href = 'dashboard.html';
    }

    // 3. Attach event listeners
    document.getElementById('updateBtn').addEventListener('click', updatePost);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
});

// Function to fetch the existing post data
async function loadPost() {
    try {
        const response = await fetch(`https://quillory.onrender.com/api/posts/${postId}`);
        const result = await response.json();

        if (result.success) {
            const post = result.data;
            document.getElementById('postTitle').value = post.title;
            
            if (post.tags && post.tags.length > 0) {
                document.getElementById('postTags').value = post.tags.join(', ');
            }
            
            quill.root.innerHTML = post.content_description;
        } else {
            showCustomAlert('Post not found.', 'error');
            window.location.href = 'dashboard.html';
        }
    } catch (error) {
        console.error('Error loading post:', error);
    }
}

// Function to send the updated data to the API
async function updatePost() {
    const title = document.getElementById('postTitle').value;
    const content = quill.root.innerHTML;
    const tagsString = document.getElementById('postTags').value;
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !content || content === '<p><br></p>') {
        showCustomAlert('Title and content are required!', 'error');
        return;
    }

    try {
        const response = await fetch(`https://quillory.onrender.com/api/posts/${postId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                content_description: content,
                tags: tags
            })
        });

        const result = await response.json();

        if (result.success) {
            showCustomAlert('Post updated successfully!');
            window.location.href = 'dashboard.html';
        } else {
            showCustomAlert('Failed to update post.', 'error');
        }
    } catch (error) {
        console.error('Error updating post:', error);
        showCustomAlert('Failed to connect to server.', 'error');
    }
}