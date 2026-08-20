// =========================================
// SMARTFLOW INITIALIZATION
// =========================================

const launchBtn =
    document.getElementById("launchBtn");

const initializationOverlay =
    document.getElementById("initializationOverlay");

const loadingBar =
    document.getElementById("loadingBar");

const loadingPercentage =
    document.getElementById("loadingPercentage");

const task1 =
    document.getElementById("task1");

const task2 =
    document.getElementById("task2");

const task3 =
    document.getElementById("task3");

const task4 =
    document.getElementById("task4");


launchBtn.addEventListener("click", () => {

    // Show initialization screen
    initializationOverlay.style.display = "flex";

    let progress = 0;


    const loading =
        setInterval(() => {

            progress++;

            // Update progress bar
            loadingBar.style.width =
                progress + "%";


            // Update percentage
            loadingPercentage.textContent =
                progress + "%";


            // Complete tasks progressively

            if (progress >= 20) {

                task1.classList.add("completed");

                task1.textContent =
                    "✓ Traffic patterns analyzed";

            }


            if (progress >= 45) {

                task2.classList.add("completed");

                task2.textContent =
                    "✓ Optimization engine ready";

            }


            if (progress >= 70) {

                task3.classList.add("completed");

                task3.textContent =
                    "✓ Urban network connected";

            }


            if (progress >= 90) {

                task4.classList.add("completed");

                task4.textContent =
                    "✓ Control center prepared";

            }


            // Finish

            if (progress >= 100) {

                clearInterval(loading);

                loadingPercentage.textContent =
                    "SYSTEM READY";

                setTimeout(() => {

                    // Login page will be connected
                    // in the next step

                    console.log(
                        "SmartFlow initialization complete"
                    );

                }, 800);

            }

        }, 35);

});