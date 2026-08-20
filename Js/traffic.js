// =========================================
// SMARTFLOW ADAPTIVE TRAFFIC ENGINE
// =========================================

// Traffic data
const trafficState = {

    north: 25,
    south: 20,
    east: 35,
    west: 30,

    density: 0,
    vehiclesPerHour: 0,
    waitTime: 0,
    optimizationScore: 0,

    // Signal timing
    currentGreenTime: 30,
    recommendedGreenTime: 30,

    // Signal system
    currentPhase: "NS",
    signalCountdown: 30

};


// =========================================
// CALCULATE TRAFFIC
// =========================================

function calculateTraffic() {

    const totalVehicles =
        trafficState.north +
        trafficState.south +
        trafficState.east +
        trafficState.west;


    // =====================================
    // VEHICLES / HOUR
    // =====================================

    trafficState.vehiclesPerHour =
        Math.round(totalVehicles * 18);


    // =====================================
    // TRAFFIC DENSITY
    // =====================================

    trafficState.density =
        Math.min(
            100,
            Math.round((totalVehicles / 280) * 100)
        );


    // =====================================
    // WAIT TIME
    // =====================================

    trafficState.waitTime =
        Math.max(
            5,
            Math.round(
                8 + trafficState.density * 0.45
            )
        );


    // =====================================
    // OPTIMIZATION SCORE
    // =====================================

    trafficState.optimizationScore =
        Math.max(
            45,
            Math.min(
                98,
                Math.round(
                    100 -
                    trafficState.density * 0.35
                )
            )
        );


    // =====================================
    // RECOMMENDED GREEN TIME
    // =====================================

    trafficState.recommendedGreenTime =
        Math.max(
            20,
            Math.min(
                60,
                Math.round(
                    25 +
                    trafficState.density * 0.35
                )
            )
        );


    updateDashboard();

}


// =========================================
// SIMULATE TRAFFIC
// =========================================

function simulateTraffic() {

    trafficState.north =
        randomTraffic(10, 70);

    trafficState.south =
        randomTraffic(10, 70);

    trafficState.east =
        randomTraffic(10, 70);

    trafficState.west =
        randomTraffic(10, 70);


    calculateTraffic();

}


// =========================================
// RANDOM TRAFFIC
// =========================================

function randomTraffic(min, max) {

    return Math.floor(
        Math.random() * (max - min + 1)
    ) + min;

}


// =========================================
// GET DIRECTIONAL LOAD
// =========================================

function getNorthSouthTraffic() {

    return (
        trafficState.north +
        trafficState.south
    );

}


function getEastWestTraffic() {

    return (
        trafficState.east +
        trafficState.west
    );

}


// =========================================
// CHOOSE BEST SIGNAL PHASE
// =========================================

function chooseBestPhase() {

    const northSouth =
        getNorthSouthTraffic();

    const eastWest =
        getEastWestTraffic();


    // Give GREEN to direction
    // having more traffic.

    if (northSouth > eastWest) {

        return "NS";

    }

    else if (eastWest > northSouth) {

        return "EW";

    }


    // If equal traffic,
    // alternate the phase.

    return trafficState.currentPhase === "NS"
        ? "EW"
        : "NS";

}


// =========================================
// START NEW SIGNAL PHASE
// =========================================

function startNewPhase() {

    const nextPhase =
        chooseBestPhase();


    trafficState.currentPhase =
        nextPhase;


    // Use recommended green time
    // for the new phase.

    trafficState.currentGreenTime =
        trafficState.recommendedGreenTime;


    trafficState.signalCountdown =
        trafficState.currentGreenTime;


    updateSignalDisplay();

}


// =========================================
// SIGNAL COUNTDOWN
// =========================================

function runSignalTimer() {

    trafficState.signalCountdown--;


    // If timer reaches zero,
    // choose a new direction.

    if (
        trafficState.signalCountdown <= 0
    ) {

        // Recalculate traffic first
        calculateTraffic();


        // Then choose the direction
        // with higher traffic.

        startNewPhase();

        return;

    }


    updateSignalDisplay();

}


// =========================================
// UPDATE SIGNAL DISPLAY
// =========================================

function updateSignalDisplay() {

    // -------------------------------------
    // COUNTDOWN
    // -------------------------------------

    const countdown =
        document.getElementById(
            "signalCountdown"
        );


    if (countdown) {

        countdown.textContent =
            trafficState.signalCountdown;

    }


    // -------------------------------------
    // SIGNAL LIGHTS
    // -------------------------------------

    const leftLight =
        document.querySelector(
            ".light-left"
        );


    const rightLight =
        document.querySelector(
            ".light-right"
        );


    if (leftLight) {

        setSignalLight(
            leftLight,
            trafficState.currentPhase === "NS"
        );

    }


    if (rightLight) {

        setSignalLight(
            rightLight,
            trafficState.currentPhase === "EW"
        );

    }


    // -------------------------------------
    // STATUS TEXT
    // -------------------------------------

    const statusElements =
        document.querySelectorAll(
            ".signal-status-row strong"
        );


    if (statusElements.length >= 2) {

        if (
            trafficState.currentPhase === "NS"
        ) {

            statusElements[0].textContent =
                "GO";

            statusElements[1].textContent =
                "STOP";

        }

        else {

            statusElements[0].textContent =
                "STOP";

            statusElements[1].textContent =
                "GO";

        }

    }

}


// =========================================
// SET TRAFFIC LIGHT
// =========================================

function setSignalLight(
    light,
    isGreen
) {

    const red =
        light.querySelector(".red");

    const yellow =
        light.querySelector(".yellow");

    const green =
        light.querySelector(".green");


    // Remove active state

    if (red) {

        red.classList.remove(
            "active-light"
        );

    }

    if (yellow) {

        yellow.classList.remove(
            "active-light"
        );

    }

    if (green) {

        green.classList.remove(
            "active-light"
        );

    }


    // Activate correct light

    if (isGreen) {

        if (green) {

            green.classList.add(
                "active-light"
            );

        }

    }

    else {

        if (red) {

            red.classList.add(
                "active-light"
            );

        }

    }

}


// =========================================
// UPDATE DASHBOARD
// =========================================

function updateDashboard() {

    // =====================================
    // KPI VALUES
    // =====================================

    const density =
        document.getElementById(
            "trafficDensity"
        );


    const vehicleCount =
        document.getElementById(
            "vehicleCount"
        );


    const waitTime =
        document.getElementById(
            "waitTime"
        );


    const optimizationScore =
        document.getElementById(
            "optimizationScore"
        );


    if (density) {

        density.textContent =
            trafficState.density + "%";

    }


    if (vehicleCount) {

        vehicleCount.textContent =
            trafficState.vehiclesPerHour
                .toLocaleString();

    }


    if (waitTime) {

        waitTime.textContent =
            trafficState.waitTime + "s";

    }


    if (optimizationScore) {

        optimizationScore.textContent =
            trafficState.optimizationScore + "%";

    }


    // =====================================
    // DENSITY PROGRESS
    // =====================================

    const densityProgress =
        document.getElementById(
            "densityProgress"
        );


    if (densityProgress) {

        densityProgress.style.width =
            trafficState.density + "%";

    }


    // =====================================
    // DENSITY STATUS
    // =====================================

    const densityStatus =
        document.getElementById(
            "densityStatus"
        );


    if (densityStatus) {

        if (
            trafficState.density < 30
        ) {

            densityStatus.textContent =
                "Low congestion";

        }

        else if (
            trafficState.density < 60
        ) {

            densityStatus.textContent =
                "Moderate congestion";

        }

        else if (
            trafficState.density < 80
        ) {

            densityStatus.textContent =
                "Heavy congestion";

        }

        else {

            densityStatus.textContent =
                "Critical congestion";

        }

    }


    // =====================================
    // VEHICLE TREND
    // =====================================

    const vehicleTrend =
        document.getElementById(
            "vehicleTrend"
        );


    if (vehicleTrend) {

        vehicleTrend.textContent =
            "↑ Live traffic flow";

    }


    // =====================================
    // OPTIMIZATION STATUS
    // =====================================

    const optimizationStatus =
        document.getElementById(
            "optimizationStatus"
        );


    if (optimizationStatus) {

        if (
            trafficState.optimizationScore >= 80
        ) {

            optimizationStatus.textContent =
                "Excellent signal efficiency";

        }

        else if (
            trafficState.optimizationScore >= 60
        ) {

            optimizationStatus.textContent =
                "Good signal efficiency";

        }

        else {

            optimizationStatus.textContent =
                "Optimization required";

        }

    }


    // =====================================
    // WAIT TIME STATUS
    // =====================================

    const waitTrend =
        document.getElementById(
            "waitTrend"
        );


    if (waitTrend) {

        waitTrend.textContent =
            "↓ Calculated from traffic load";

    }


    // =====================================
    // DIRECTIONAL TRAFFIC
    // =====================================

    updateDirection(
        "northTraffic",
        "northBar",
        trafficState.north
    );


    updateDirection(
        "southTraffic",
        "southBar",
        trafficState.south
    );


    updateDirection(
        "eastTraffic",
        "eastBar",
        trafficState.east
    );


    updateDirection(
        "westTraffic",
        "westBar",
        trafficState.west
    );


    // =====================================
    // OPTIMIZER
    // =====================================

    const recommendedTime =
        document.getElementById(
            "recommendedTime"
        );


    const greenTime =
        document.getElementById(
            "greenTime"
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


    if (recommendedTime) {

        recommendedTime.textContent =
            trafficState.recommendedGreenTime +
            " seconds";

    }


    if (greenTime) {

        greenTime.textContent =
            trafficState.recommendedGreenTime;

    }


    if (recommendedGreenTime) {

        recommendedGreenTime.textContent =
            trafficState.recommendedGreenTime +
            "s";

    }


    if (currentGreenTime) {

        currentGreenTime.textContent =
            trafficState.signalCountdown +
            "s";

    }


    if (improvementTime) {

        const improvement =
            trafficState.recommendedGreenTime -
            trafficState.currentGreenTime;


        improvementTime.textContent =
            (improvement >= 0 ? "+" : "") +
            improvement +
            "s";

    }


    // =====================================
    // UPDATE SIGNAL
    // =====================================

    updateSignalDisplay();

}


// =========================================
// UPDATE DIRECTION BAR
// =========================================

function updateDirection(
    valueId,
    barId,
    value
) {

    const valueElement =
        document.getElementById(
            valueId
        );


    const barElement =
        document.getElementById(
            barId
        );


    if (valueElement) {

        valueElement.textContent =
            value;

    }


    if (barElement) {

        barElement.style.width =
            Math.min(
                value,
                100
            ) + "%";

    }

}


// =========================================
// INITIALIZE SMARTFLOW
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        // First calculate traffic

        calculateTraffic();


        // Select the best initial phase

        trafficState.currentPhase =
            chooseBestPhase();


        // Start with recommended timing

        trafficState.currentGreenTime =
            trafficState.recommendedGreenTime;


        trafficState.signalCountdown =
            trafficState.currentGreenTime;


        // Update everything

        updateDashboard();


        // =================================
        // TRAFFIC CHANGES EVERY 3 SECONDS
        // =================================

        setInterval(
            simulateTraffic,
            3000
        );


        // =================================
        // SIGNAL TIMER EVERY 1 SECOND
        // =================================

        setInterval(
            runSignalTimer,
            1000
        );

    }
);