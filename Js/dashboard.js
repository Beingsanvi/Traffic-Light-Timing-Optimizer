// =========================================
// SMARTFLOW DASHBOARD
// =========================================


// =========================================
// CURRENT TIME
// =========================================

const currentTime =
    document.getElementById("currentTime");


function updateTime() {

    const now = new Date();

    currentTime.textContent =
        now.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

}


updateTime();

setInterval(updateTime, 1000);


// =========================================
// USER NAME
// =========================================

const sidebarUser =
    document.getElementById("sidebarUser");


const storedUser =
    JSON.parse(
        localStorage.getItem("smartflowUser")
    );


if (storedUser && storedUser.name) {

    sidebarUser.textContent =
        storedUser.name;

}


// =========================================
// SIGNAL COUNTDOWN
// =========================================

const signalCountdown =
    document.getElementById("signalCountdown");


let countdown = 27;


setInterval(() => {

    countdown--;

    if (countdown <= 0) {

        countdown = 30;

    }

    signalCountdown.textContent =
        countdown;

}, 1000);


// =========================================
// OPTIMIZATION
// =========================================

const optimizeBtn =
    document.getElementById("optimizeBtn");


const optimizationScore =
    document.getElementById("optimizationScore");


const waitTime =
    document.getElementById("waitTime");


const greenTime =
    document.getElementById("greenTime");


const recommendedTime =
    document.getElementById("recommendedTime");


optimizeBtn.addEventListener(
    "click",
    () => {

        optimizeBtn.textContent =
            "⟳ OPTIMIZING...";

        optimizeBtn.disabled = true;


        let progress = 0;


        const optimization =
            setInterval(() => {

                progress += 10;


                if (progress >= 100) {

                    clearInterval(
                        optimization
                    );


                    optimizationScore.textContent =
                        "94%";

                    waitTime.textContent =
                        "27s";

                    greenTime.textContent =
                        "48";

                    recommendedTime.textContent =
                        "48 seconds";


                    optimizeBtn.textContent =
                        "✓ SIGNAL OPTIMIZED";


                    setTimeout(() => {

                        optimizeBtn.textContent =
                            "✦ OPTIMIZE SIGNAL TIMING";

                        optimizeBtn.disabled =
                            false;

                    }, 2000);

                }

            }, 120);

    }
);


// =========================================
// LOGOUT
// =========================================

const logoutBtn =
    document.getElementById("logoutBtn");


logoutBtn.addEventListener(
    "click",
    () => {

        localStorage.removeItem(
            "smartflowLoggedIn"
        );

        localStorage.removeItem(
            "smartflowUser"
        );

        window.location.href =
            "login.html";

    }
);