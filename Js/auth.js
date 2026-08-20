// ==========================================
// SMARTFLOW AUTHENTICATION
// LOGIN + SIGNUP + LOGOUT
// ==========================================


// ==========================================
// HELPER: SHOW POPUP
// ==========================================

function showMessage(message) {
    alert(message);
}


// ==========================================
// SIGNUP
// ==========================================

const signupForm = document.getElementById("signupForm");

if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("signupEmail").value.trim().toLowerCase();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;


        // Check password match
        if (password !== confirmPassword) {

            showMessage("Password does not match.");

            return;
        }


        // Check password length
        if (password.length < 6) {

            showMessage(
                "Password must contain at least 6 characters."
            );

            return;
        }


        // Get existing users
        const users =
            JSON.parse(localStorage.getItem("smartflowUsers")) || [];


        // Check duplicate email
        const existingUser =
            users.find(user => user.email === email);


        if (existingUser) {

            showMessage(
                "This email is already registered."
            );

            return;
        }


        // Create new user
        const newUser = {

            name: name,

            email: email,

            password: password

        };


        // Add user
        users.push(newUser);


        // Save users
        localStorage.setItem(
            "smartflowUsers",
            JSON.stringify(users)
        );


        showMessage(
            "Account created successfully! You can now sign in."
        );


        // Go to login page
        window.location.href = "login.html";

    });

}



// ==========================================
// LOGIN
// ==========================================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value.trim().toLowerCase();

        const password =
            document.getElementById("password").value;


        // Get registered users
        const users =
            JSON.parse(localStorage.getItem("smartflowUsers")) || [];


        // Find user by email
        const user =
            users.find(user => user.email === email);


        // Email not registered
        if (!user) {

            showMessage(
                "Account not found. Please create an account first."
            );

            return;
        }


        // Wrong password
        if (user.password !== password) {

            showMessage(
                "Password does not match."
            );

            return;
        }


        // Save logged-in user
        localStorage.setItem(
            "smartflowLoggedInUser",
            JSON.stringify({
                name: user.name,
                email: user.email
            })
        );


        // Login successful
        showMessage(
            "Login successful! Welcome to SmartFlow."
        );


        // Go to dashboard
        window.location.href = "dashboard.html";

    });

}



// ==========================================
// PASSWORD SHOW / HIDE
// ==========================================

const togglePassword =
    document.getElementById("togglePassword");

const passwordInput =
    document.getElementById("password");


if (togglePassword && passwordInput) {

    togglePassword.addEventListener("click", function () {

        if (passwordInput.type === "password") {

            passwordInput.type = "text";

            togglePassword.textContent = "HIDE";

        } else {

            passwordInput.type = "password";

            togglePassword.textContent = "SHOW";

        }

    });

}



// ==========================================
// LOGOUT
// ==========================================

const logoutBtn =
    document.getElementById("logoutBtn");


if (logoutBtn) {

    logoutBtn.addEventListener("click", function () {

        localStorage.removeItem(
            "smartflowLoggedInUser"
        );

        window.location.href = "login.html";

    });

}