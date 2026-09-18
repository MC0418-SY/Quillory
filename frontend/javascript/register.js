document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.querySelector('.login-form');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Updated IDs to match your HTML exactly
        const username = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;

        if (!username || !email || !password) {
            return showCustomAlert('All fields are required!', 'error');
        }

        // Check if passwords match
        if (password !== confirmPassword) {
            return showCustomAlert('Passwords do not match!', 'error');
        }

        try {
            const response = await fetch('https://quillory.onrender.com/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const result = await response.json();

            if (result.success) {
                // Save token and user ID to localStorage
                localStorage.setItem('token', result.token);
                localStorage.setItem('user_id', result.userId);
                
                showCustomAlert('Account created successfully! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                showCustomAlert(result.message || 'Registration failed.', 'error');
            }
        } catch (error) {
            console.error('Registration Error:', error);
            showCustomAlert('Failed to connect to server.', 'error');
        }
    });
});