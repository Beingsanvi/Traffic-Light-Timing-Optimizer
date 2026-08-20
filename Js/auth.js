// =========================================
// SMARTFLOW AUTHENTICATION
// =========================================


// =========================================
// SIGNUP
// =========================================

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const name =
            document.getElementById("name").value.trim();

        const email =
            document.getElementById("signupEmail").value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("signupPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const message =
            document.getElementById("signupMessage");


        // =========================================
        // CHECK PASSWORD
        // =========================================

        if (password !== confirmPassword) {

            message.textContent =
                "Password does not match.";

            message.className =
                "auth-message error";

            return;
        }


        // =========================================
        // GET EXISTING USERS
        // =========================================

        const users =
            JSON.parse(
                localStorage.getItem("smartflowUsers")
            ) || [];


        // =========================================
        // CHECK DUPLICATE EMAIL
        // =========================================

        const existingUser =
            users.find(
                user => user.email === email
            );


        if (existingUser) {

            message.textContent =
                "Email already registered. Please sign in.";

            message.className =
                "auth-message error";

            return;
        }


        // =========================================
        // CREATE NEW USER
        // =========================================

        const newUser = {

            name: name,

            email: email,

            password: password

        };


        users.push(newUser);


        localStorage.setItem(
            "smartflowUsers",
            JSON.stringify(users)
        );


        // =========================================
        // SUCCESS
        // =========================================

        message.textContent =
            "Account created successfully! Redirecting...";

        message.className =
            "auth-message success";


        setTimeout(() => {

            window.location.href =
                "login.html";

        }, 1200);

    });

}


// =========================================
// LOGIN
// =========================================

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();


        const email =
            document.getElementById("email").value
                .trim()
                .toLowerCase();

        const password =
            document.getElementById("password").value;


        // =========================================
        // GET USERS
        // =========================================

        const users =
            JSON.parse(
                localStorage.getItem("smartflowUsers")
            ) || [];


        // =========================================
        // FIND EMAIL
        // =========================================

        const user =
            users.find(
                user => user.email === email
            );


        // =========================================
        // EMAIL NOT REGISTERED
        // =========================================

        if (!user) {

            showLoginMessage(
                "Email is not registered."
            );

            return;
        }


        // =========================================
        // WRONG PASSWORD
        // =========================================

        if (user.password !== password) {

            showLoginMessage(
                "Incorrect password."
            );

            return;
        }


        // =========================================
        // LOGIN SUCCESS
        // =========================================

        localStorage.setItem(
            "smartflowLoggedIn",
            "true"
        );

        localStorage.setItem(
            "smartflowUser",
            JSON.stringify(user)
        );


        window.location.href =
            "dashboard.html";

    });

}


// =========================================
// PASSWORD SHOW / HIDE
// =========================================

const togglePassword =
    document.getElementById("togglePassword");

const loginPassword =
    document.getElementById("password");


if (togglePassword && loginPassword) {

    togglePassword.addEventListener(
        "click",
        () => {

            if (
                loginPassword.type === "password"
            ) {

                loginPassword.type = "text";

                togglePassword.textContent =
                    "HIDE";

            } else {

                loginPassword.type = "password";

                togglePassword.textContent =
                    "SHOW";

            }

        }
    );

}


// =========================================
// LOGIN ERROR MESSAGE
// =========================================

function showLoginMessage(text) {

    let message =
        document.getElementById("loginMessage");


    if (!message) {

        message =
            document.createElement("div");

        message.id =
            "loginMessage";

        message.className =
            "auth-message error";


        loginForm.insertBefore(
            message,
            loginForm.querySelector(".auth-submit")
        );

    }


    message.textContent = text;

}