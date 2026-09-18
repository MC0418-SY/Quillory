document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent page refresh

        // 1. Grab the values from the form
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            // 2. Send the login request to the Node.js backend
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            // 3. Handle the response
            if (result.success) {
                // Save token and user ID to localStorage so the app remembers the user
                localStorage.setItem('token', result.token);
                localStorage.setItem('user_id', result.userId);
                
                showCustomAlert('Login successful! Redirecting...');
                
                // Redirect to dashboard after 1 second (gives the alert time to show)
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1000);
            } else {
                // Show error if credentials are wrong
                showCustomAlert(result.message || 'Login failed.', 'error');
            }
        } catch (error) {
            console.error('Login Error:', error);
            showCustomAlert('Failed to connect to server. Is the backend running?', 'error');
        }
    });
});