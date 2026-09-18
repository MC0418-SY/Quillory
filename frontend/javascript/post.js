// Redirect to login if not authenticated
const userId = localStorage.getItem('user_id');
if (!userId) {
    window.location.href = 'login.html';
}

// Initialize Quill with all your requested formatting
const quill = new Quill('#editor', {
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

// Handle Publish Button Click
document.getElementById('publishBtn').addEventListener('click', async () => {
    const title = document.getElementById('postTitle').value;
    const tagsString = document.getElementById('postTags').value;
    const content = quill.root.innerHTML;

    if (!title || !content || content === '<p><br></p>') {
        showCustomAlert('Title and content are required!', 'error');
        return;
    }

    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);

    try {
        const response = await fetch('https://quillory.onrender.com/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: userId, // Uses the localStorage variable
                title: title,
                content_description: content,
                tags: tags
            })
        });

        const result = await response.json();
        if (result.success) {
            window.location.href = 'dashboard.html';
        } else {
            showCustomAlert('Failed to publish post.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showCustomAlert('Failed to connect to server.', 'error');
    }
});