// =========================================
// SMARTFLOW AI SIGNAL OPTIMIZER
// =========================================

let activeDirection = "NS";


// =========================================
// CALCULATE BEST GREEN TIME
// =========================================

function calculateOptimalSignal() {

    if (typeof trafficState === "undefined") {
        return;
    }


    const northSouth =
        trafficState.north +
        trafficState.south;


    const eastWest =
        trafficState.east +
        trafficState.west;


    let recommendedTime;


    // -----------------------------------------
    // NORTH / SOUTH HAS MORE TRAFFIC
    // -----------------------------------------

    if (northSouth > eastWest) {

        activeDirection = "NS";


        recommendedTime =
            Math.min(
                60,
                Math.max(
                    25,
                    Math.round(
                        25 + northSouth * 0.25
                    )
                )
            );

    }


    // -----------------------------------------
    // EAST / WEST HAS MORE TRAFFIC
    // -----------------------------------------

    else {

        activeDirection = "EW";


        recommendedTime =
            Math.min(
                60,
                Math.max(
                    25,
                    Math.round(
                        25 + eastWest * 0.25
                    )
                )
            );

    }


    trafficState.recommendedGreenTime =
        recommendedTime;


    updateOptimizerUI();

}


// =========================================
// UPDATE OPTIMIZER UI
// =========================================

function updateOptimizerUI() {

    const recommended =
        trafficState.recommendedGreenTime;


    const current =
        trafficState.currentGreenTime;


    const improvement =
        recommended - current;


    const greenTime =
        document.getElementById(
            "greenTime"
        );


    const recommendedTime =
        document.getElementById(
            "recommendedTime"
        );


    const recommendedGreenTime =
        document.getElementById(
            "recommendedGreenTime"
        );


    const currentGreenTime =
        document.getElementById(
            "currentGreenTime"
        );


    const improvementTime =
        document.getElementById(
            "improvementTime"
        );


    if (greenTime) {

        greenTime.textContent =
            recommended;

    }


    if (recommendedTime) {

        recommendedTime.textContent =
            recommended + " seconds";

    }


    if (recommendedGreenTime) {

        recommendedGreenTime.textContent =
            recommended + "s";

    }


    if (currentGreenTime) {

        currentGreenTime.textContent =
            current + "s";

    }


    if (improvementTime) {

        improvementTime.textContent =
            (improvement >= 0 ? "+" : "") +
            improvement +
            "s";

    }

}


// =========================================
// APPLY OPTIMIZATION
// =========================================

function applyOptimization() {

    if (typeof trafficState === "undefined") {
        return;
    }


    calculateOptimalSignal();


    trafficState.currentGreenTime =
        trafficState.recommendedGreenTime;


    updateOptimizerUI();


    console.log(
        "SmartFlow optimized:",
        activeDirection,
        trafficState.currentGreenTime,
        "seconds"
    );

}


// =========================================
// OPTIMIZE BUTTON
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const optimizeBtn =
            document.getElementById(
                "optimizeBtn"
            );


        if (optimizeBtn) {

            optimizeBtn.addEventListener(
                "click",
                () => {

                    applyOptimization();

                }
            );

        }

    }
);