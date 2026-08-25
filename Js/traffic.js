// =========================================
// SMARTFLOW ADAPTIVE TRAFFIC ENGINE
// =========================================


// =========================================
// MAIN TRAFFIC STATE
// =========================================

const trafficState = {

    north: 25,
    south: 20,
    east: 35,
    west: 30,

    density: 0,
    vehiclesPerHour: 0,
    waitTime: 0,
    optimizationScore: 0,

    currentGreenTime: 30,
    recommendedGreenTime: 30,

    currentPhase: "NS",
    signalCountdown: 30

};


// =========================================
// MULTI-INTERSECTION NETWORK
// =========================================

const intersectionNetwork = {

    central: {

        id: "001",

        name: "Central Ave × 5th",

        north: 25,
        south: 20,
        east: 35,
        west: 30,

        density: 0,
        waitTime: 0,
        optimizationScore: 0,

        currentPhase: "NS",
        greenTime: 30

    },


    market: {

        id: "002",

        name: "Market St × 3rd",

        north: 40,
        south: 35,
        east: 55,
        west: 45,

        density: 0,
        waitTime: 0,
        optimizationScore: 0,

        currentPhase: "EW",
        greenTime: 35

    },


    park: {

        id: "003",

        name: "Park Ave × 8th",

        north: 20,
        south: 25,
        east: 30,
        west: 25,

        density: 0,
        waitTime: 0,
        optimizationScore: 0,

        currentPhase: "NS",
        greenTime: 30

    },


    main: {

        id: "004",

        name: "Main St × 2nd",

        north: 60,
        south: 55,
        east: 65,
        west: 60,

        density: 0,
        waitTime: 0,
        optimizationScore: 0,

        currentPhase: "EW",
        greenTime: 45

    }

};


// =========================================
// CALCULATE NETWORK METRICS
// =========================================

function calculateNetworkMetrics() {

    Object.values(intersectionNetwork).forEach(
        intersection => {

            const totalVehicles =
                intersection.north +
                intersection.south +
                intersection.east +
                intersection.west;


            const maximumVehicles =
                80 * 4;


            intersection.density =
                Math.min(
                    100,
                    Math.round(
                        (
                            totalVehicles /
                            maximumVehicles
                        ) * 100
                    )
                );


            intersection.waitTime =
                Math.max(
                    5,
                    Math.round(
                        8 +
                        intersection.density * 0.45
                    )
                );


            const northSouth =
                intersection.north +
                intersection.south;


            const eastWest =
                intersection.east +
                intersection.west;


            const imbalance =
                Math.abs(
                    northSouth -
                    eastWest
                );


            intersection.optimizationScore =
                Math.max(
                    45,
                    Math.min(
                        98,
                        Math.round(
                            100 -
                            imbalance * 0.4
                        )
                    )
                );


            intersection.greenTime =
                Math.max(
                    20,
                    Math.min(
                        60,
                        Math.round(
                            25 +
                            intersection.density * 0.35
                        )
                    )
                );

        }
    );

}


// =========================================
// SIMULATE NETWORK TRAFFIC
// =========================================

function simulateNetworkTraffic() {

    Object.values(intersectionNetwork).forEach(
        intersection => {

            intersection.north =
                randomNetworkTraffic(
                    intersection.north
                );


            intersection.south =
                randomNetworkTraffic(
                    intersection.south
                );


            intersection.east =
                randomNetworkTraffic(
                    intersection.east
                );


            intersection.west =
                randomNetworkTraffic(
                    intersection.west
                );

        }
    );


    calculateNetworkMetrics();

    updateNetworkDisplay();

}


// =========================================
// RANDOM NETWORK TRAFFIC
// =========================================

function randomNetworkTraffic(
    currentValue
) {

    const change =
        Math.floor(
            Math.random() * 15
        ) - 7;


    return Math.max(
        0,
        Math.min(
            80,
            currentValue + change
        )
    );

}


// =========================================
// UPDATE NETWORK DISPLAY
// =========================================

function updateNetworkDisplay() {

    const intersections =
        Object.values(
            intersectionNetwork
        );


    let totalDensity = 0;

    let highest = null;


    intersections.forEach(
        intersection => {

            totalDensity +=
                intersection.density;


            if (
                highest === null ||
                intersection.density >
                highest.density
            ) {

                highest =
                    intersection;

            }


            const scoreElement =
                document.getElementById(
                    `network-score-${intersection.id}`
                );


            if (scoreElement) {

                scoreElement.textContent =
                    intersection.optimizationScore +
                    "%";

            }


            const statusElement =
                document.getElementById(
                    `network-status-${intersection.id}`
                );


            if (statusElement) {

                statusElement.classList.remove(
                    "green-state",
                    "yellow-state",
                    "red-state"
                );


                if (
                    intersection.density >= 80
                ) {

                    statusElement.textContent =
                        "HIGH LOAD";

                    statusElement.classList.add(
                        "red-state"
                    );

                }

                else if (
                    intersection.density >= 60
                ) {

                    statusElement.textContent =
                        "MONITOR";

                    statusElement.classList.add(
                        "yellow-state"
                    );

                }

                else {

                    statusElement.textContent =
                        "OPTIMAL";

                    statusElement.classList.add(
                        "green-state"
                    );

                }

            }


            const signalElement =
                document.getElementById(
                    `network-signal-${intersection.id}`
                );


            if (signalElement) {

                signalElement.classList.remove(
                    "green",
                    "yellow",
                    "red"
                );


                if (
                    intersection.density >= 80
                ) {

                    signalElement.classList.add(
                        "red"
                    );

                }

                else if (
                    intersection.density >= 60
                ) {

                    signalElement.classList.add(
                        "yellow"
                    );

                }

                else {

                    signalElement.classList.add(
                        "green"
                    );

                }

            }

        }
    );


    const networkDensity =
        document.getElementById(
            "networkDensity"
        );


    if (
        networkDensity &&
        intersections.length > 0
    ) {

        networkDensity.textContent =
            Math.round(
                totalDensity /
                intersections.length
            ) + "%";

    }


    const highestLoad =
        document.getElementById(
            "networkHighestLoad"
        );


    if (
        highestLoad &&
        highest
    ) {

        highestLoad.textContent =
            highest.name +
            " · " +
            highest.density +
            "%";

    }

}


// =========================================
// CALCULATE MAIN INTERSECTION
// =========================================

function calculateTraffic() {

    const totalVehicles =
        trafficState.north +
        trafficState.south +
        trafficState.east +
        trafficState.west;


    trafficState.vehiclesPerHour =
        Math.round(
            totalVehicles * 18
        );


    trafficState.density =
        Math.min(
            100,
            Math.round(
                (
                    totalVehicles /
                    280
                ) * 100
            )
        );


    trafficState.waitTime =
        Math.max(
            5,
            Math.round(
                8 +
                trafficState.density * 0.45
            )
        );


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
// SIMULATE MAIN TRAFFIC
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
// RANDOM MAIN TRAFFIC
// =========================================

function randomTraffic(
    min,
    max
) {

    return Math.floor(
        Math.random() *
        (max - min + 1)
    ) + min;

}


// =========================================
// GET NORTH / SOUTH LOAD
// =========================================

function getNorthSouthTraffic() {

    return (
        trafficState.north +
        trafficState.south
    );

}


// =========================================
// GET EAST / WEST LOAD
// =========================================

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


    if (
        northSouth >
        eastWest
    ) {

        return "NS";

    }


    if (
        eastWest >
        northSouth
    ) {

        return "EW";

    }


    return (
        trafficState.currentPhase === "NS"
            ? "EW"
            : "NS"
    );

}


// =========================================
// START NEW SIGNAL PHASE
// =========================================

function startNewPhase() {

    const nextPhase =
        chooseBestPhase();


    trafficState.currentPhase =
        nextPhase;


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


    if (
        trafficState.signalCountdown <= 0
    ) {

        calculateTraffic();

        startNewPhase();

        return;

    }


    updateSignalDisplay();

}


// =========================================
// UPDATE SIGNAL DISPLAY
// =========================================

function updateSignalDisplay() {

    const countdown =
        document.getElementById(
            "signalCountdown"
        );


    if (countdown) {

        countdown.textContent =
            trafficState.signalCountdown;

    }


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


    const statusElements =
        document.querySelectorAll(
            ".signal-status-row strong"
        );


    if (
        statusElements.length >= 2
    ) {

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
        light.querySelector(
            ".red"
        );


    const yellow =
        light.querySelector(
            ".yellow"
        );


    const green =
        light.querySelector(
            ".green"
        );


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
            trafficState.density +
            "%";

    }


    if (vehicleCount) {

        vehicleCount.textContent =
            trafficState.vehiclesPerHour
                .toLocaleString();

    }


    if (waitTime) {

        waitTime.textContent =
            trafficState.waitTime +
            "s";

    }


    if (optimizationScore) {

        optimizationScore.textContent =
            trafficState.optimizationScore +
            "%";

    }


    const densityProgress =
        document.getElementById(
            "densityProgress"
        );


    if (densityProgress) {

        densityProgress.style.width =
            trafficState.density +
            "%";

    }


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


    const vehicleTrend =
        document.getElementById(
            "vehicleTrend"
        );


    if (vehicleTrend) {

        vehicleTrend.textContent =
            "↑ Live traffic flow";

    }


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


    const waitTrend =
        document.getElementById(
            "waitTrend"
        );


    if (waitTrend) {

        waitTrend.textContent =
            "↓ Calculated from traffic load";

    }


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


    updateSignalDisplay();


    // =====================================
    // UPDATE AI DECISION PANEL
    // =====================================

    updateAIDecision();

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
// SIGNAL OPTIMIZER
// =========================================

function optimizeSignalTiming() {

    const northSouth =
        getNorthSouthTraffic();


    const eastWest =
        getEastWestTraffic();


    const busiestLoad =
        Math.max(
            northSouth,
            eastWest
        );


    const optimizedTime =
        Math.max(
            20,
            Math.min(
                60,
                Math.round(
                    20 +
                    busiestLoad * 0.25
                )
            )
        );


    trafficState.recommendedGreenTime =
        optimizedTime;


    trafficState.currentGreenTime =
        optimizedTime;


    if (
        northSouth >
        eastWest
    ) {

        trafficState.currentPhase =
            "NS";

    }

    else if (
        eastWest >
        northSouth
    ) {

        trafficState.currentPhase =
            "EW";

    }


    trafficState.signalCountdown =
        optimizedTime;


    updateDashboard();


    const button =
        document.querySelector(
            ".optimize-btn"
        );


    if (button) {

        const originalText =
            "✦ OPTIMIZE SIGNAL TIMING";


        button.textContent =
            "OPTIMIZING...";


        setTimeout(
            () => {

                button.textContent =
                    originalText;

            },
            800
        );

    }

}


// =========================================
// CONNECT OPTIMIZER BUTTON
// =========================================

function connectOptimizer() {

    const optimizeButton =
        document.getElementById(
            "optimizeBtn"
        );


    if (
        optimizeButton &&
        !optimizeButton.dataset.connected
    ) {

        optimizeButton.dataset.connected =
            "true";


        optimizeButton.addEventListener(
            "click",
            optimizeSignalTiming
        );

    }

}


// =========================================
// AI DECISION ENGINE
// =========================================

function updateAIDecision() {

    const northSouth =
        trafficState.north +
        trafficState.south;


    const eastWest =
        trafficState.east +
        trafficState.west;


    const totalTraffic =
        northSouth +
        eastWest;


    if (totalTraffic <= 0) {

        return;

    }


    let priority;

    let priorityTraffic;

    let otherTraffic;


    if (northSouth >= eastWest) {

        priority =
            "NORTH / SOUTH";

        priorityTraffic =
            northSouth;

        otherTraffic =
            eastWest;

    }

    else {

        priority =
            "EAST / WEST";

        priorityTraffic =
            eastWest;

        otherTraffic =
            northSouth;

    }


    const difference =
        Math.round(
            (
                Math.abs(
                    priorityTraffic -
                    otherTraffic
                ) /
                totalTraffic
            ) * 100
        );


    const recommended =
        trafficState.recommendedGreenTime;


    const waitReduction =
        Math.max(
            5,
            Math.min(
                35,
                Math.round(
                    difference * 0.8
                )
            )
        );


    const priorityElement =
        document.getElementById(
            "aiPriority"
        );


    if (priorityElement) {

        priorityElement.textContent =
            priority;

    }


    const differenceElement =
        document.getElementById(
            "aiTrafficDifference"
        );


    if (differenceElement) {

        differenceElement.textContent =
            difference +
            "% higher";

    }


    const recommendedElement =
        document.getElementById(
            "aiRecommendedTime"
        );


    if (recommendedElement) {

        recommendedElement.textContent =
            recommended +
            "s";

    }


    const reductionElement =
        document.getElementById(
            "aiWaitReduction"
        );


    if (reductionElement) {

        reductionElement.textContent =
            "~" +
            waitReduction +
            "%";

    }


    const messageElement =
        document.getElementById(
            "aiDecisionMessage"
        );


    if (messageElement) {

        messageElement.textContent =
            priority +
            " currently has " +
            difference +
            "% more traffic. " +
            "The adaptive controller recommends " +
            recommended +
            " seconds of green time " +
            "for this phase.";

    }


    const statusElement =
        document.getElementById(
            "aiDecisionStatus"
        );


    if (statusElement) {

        statusElement.textContent =
            "LIVE ANALYSIS";

    }

}


// =========================================
// INITIALIZE SMARTFLOW
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        calculateTraffic();


        trafficState.currentPhase =
            chooseBestPhase();


        trafficState.currentGreenTime =
            trafficState.recommendedGreenTime;


        trafficState.signalCountdown =
            trafficState.currentGreenTime;


        updateDashboard();


        calculateNetworkMetrics();

        updateNetworkDisplay();


        connectOptimizer();


        setInterval(
            simulateTraffic,
            3000
        );


        setInterval(
            simulateNetworkTraffic,
            3000
        );


        setInterval(
            runSignalTimer,
            1000
        );

    }
);