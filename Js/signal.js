// =========================================
// SMARTFLOW SIGNAL CONTROLLER
// =========================================

let activeDirection = "NS";
let signalPhase = "GREEN";

let countdown = 30;
let greenDuration = 30;

const YELLOW_TIME = 3;

let signalTimer = null;


// =========================================
// GET TRAFFIC DATA
// =========================================

function getTrafficData() {

    if (typeof trafficState === "undefined") {

        return {
            north: 25,
            south: 20,
            east: 35,
            west: 30
        };

    }

    return {

        north: Number(trafficState.north) || 0,
        south: Number(trafficState.south) || 0,
        east: Number(trafficState.east) || 0,
        west: Number(trafficState.west) || 0

    };
}


// =========================================
// CALCULATE DIRECTION DEMAND
// =========================================

function calculateDemand() {

    const traffic = getTrafficData();

    return {

        NS:
            traffic.north +
            traffic.south,

        EW:
            traffic.east +
            traffic.west

    };
}


// =========================================
// CHOOSE NEXT SIGNAL
// =========================================

function chooseNextDirection() {

    const demand = calculateDemand();

    console.log(
        "Traffic Demand:",
        "NS =", demand.NS,
        "EW =", demand.EW
    );


    /*
        If the current direction has much less
        traffic than the opposite direction,
        switch.

        Otherwise alternate normally.
    */

    if (activeDirection === "NS") {

        if (demand.EW > demand.NS) {

            return "EW";

        }

        return "EW";
    }


    if (activeDirection === "EW") {

        if (demand.NS > demand.EW) {

            return "NS";

        }

        return "NS";
    }

}


// =========================================
// CALCULATE GREEN TIME
// =========================================

function calculateGreenTime(direction) {

    const demand =
        calculateDemand();


    const selectedTraffic =
        direction === "NS"
            ? demand.NS
            : demand.EW;


    const totalTraffic =
        demand.NS +
        demand.EW;


    if (totalTraffic === 0) {

        return 30;

    }


    /*
        Example:

        NS = 40
        EW = 80

        EW share = 80 / 120
                 = 66%

        More traffic
        → more green time
    */

    const trafficShare =
        selectedTraffic / totalTraffic;


    let time =
        20 +
        trafficShare * 40;


    // Extra time during congestion

    if (
        typeof trafficState !== "undefined"
    ) {

        if (
            trafficState.density >= 70
        ) {

            time += 5;

        }

        if (
            trafficState.density >= 85
        ) {

            time += 5;

        }

    }


    return Math.round(
        Math.max(
            20,
            Math.min(
                60,
                time
            )
        )
    );

}


// =========================================
// GET LIGHT ELEMENTS
// =========================================

function getLights() {

    return {

        northSouth:
            document.querySelector(
                ".light-left"
            ),

        eastWest:
            document.querySelector(
                ".light-right"
            ),

        countdown:
            document.getElementById(
                "signalCountdown"
            ),

        northSouthStatus:
            document.getElementById(
                "northSouthStatus"
            ),

        eastWestStatus:
            document.getElementById(
                "eastWestStatus"
            ),

        northSouthDot:
            document.getElementById(
                "northSouthDot"
            ),

        eastWestDot:
            document.getElementById(
                "eastWestDot"
            )

    };

}


// =========================================
// REMOVE ALL ACTIVE LIGHTS
// =========================================

function clearLights() {

    const lights = getLights();


    if (lights.northSouth) {

        lights.northSouth
            .querySelector(".red")
            ?.classList.remove(
                "active-light"
            );

        lights.northSouth
            .querySelector(".yellow")
            ?.classList.remove(
                "active-light"
            );

        lights.northSouth
            .querySelector(".green")
            ?.classList.remove(
                "active-light"
            );

    }


    if (lights.eastWest) {

        lights.eastWest
            .querySelector(".red")
            ?.classList.remove(
                "active-light"
            );

        lights.eastWest
            .querySelector(".yellow")
            ?.classList.remove(
                "active-light"
            );

        lights.eastWest
            .querySelector(".green")
            ?.classList.remove(
                "active-light"
            );

    }

}


// =========================================
// NORTH / SOUTH GREEN
// =========================================

function northSouthGreen() {

    const lights = getLights();

    clearLights();


    activeDirection = "NS";
    signalPhase = "GREEN";


    // NS GREEN

    lights.northSouth
        ?.querySelector(".green")
        ?.classList.add(
            "active-light"
        );


    // EW RED

    lights.eastWest
        ?.querySelector(".red")
        ?.classList.add(
            "active-light"
        );


    updateStatus();


    console.log(
        "🟢 NORTH / SOUTH GREEN"
    );

}


// =========================================
// EAST / WEST GREEN
// =========================================

function eastWestGreen() {

    const lights = getLights();

    clearLights();


    activeDirection = "EW";
    signalPhase = "GREEN";


    // NS RED

    lights.northSouth
        ?.querySelector(".red")
        ?.classList.add(
            "active-light"
        );


    // EW GREEN

    lights.eastWest
        ?.querySelector(".green")
        ?.classList.add(
            "active-light"
        );


    updateStatus();


    console.log(
        "🟢 EAST / WEST GREEN"
    );

}


// =========================================
// NORTH / SOUTH YELLOW
// =========================================

function northSouthYellow() {

    const lights = getLights();

    clearLights();


    signalPhase = "YELLOW";


    lights.northSouth
        ?.querySelector(".yellow")
        ?.classList.add(
            "active-light"
        );


    lights.eastWest
        ?.querySelector(".red")
        ?.classList.add(
            "active-light"
        );


    updateStatus();


    console.log(
        "🟡 NORTH / SOUTH YELLOW"
    );

}


// =========================================
// EAST / WEST YELLOW
// =========================================

function eastWestYellow() {

    const lights = getLights();

    clearLights();


    signalPhase = "YELLOW";


    lights.eastWest
        ?.querySelector(".yellow")
        ?.classList.add(
            "active-light"
        );


    lights.northSouth
        ?.querySelector(".red")
        ?.classList.add(
            "active-light"
        );


    updateStatus();


    console.log(
        "🟡 EAST / WEST YELLOW"
    );

}


// =========================================
// UPDATE STATUS TEXT
// =========================================

function updateStatus() {

    const lights = getLights();


    if (
        !lights.northSouthStatus ||
        !lights.eastWestStatus
    ) {

        return;

    }


    if (activeDirection === "NS") {

        lights.northSouthStatus.textContent =
            signalPhase === "GREEN"
                ? "GO"
                : "READY";

        lights.eastWestStatus.textContent =
            "STOP";


        if (lights.northSouthDot) {

            lights.northSouthDot.className =
                signalPhase === "GREEN"
                    ? "signal-dot green-dot"
                    : "signal-dot yellow-dot";

        }


        if (lights.eastWestDot) {

            lights.eastWestDot.className =
                "signal-dot red-dot";

        }

    }

    else {

        lights.northSouthStatus.textContent =
            "STOP";

        lights.eastWestStatus.textContent =
            signalPhase === "GREEN"
                ? "GO"
                : "READY";


        if (lights.northSouthDot) {

            lights.northSouthDot.className =
                "signal-dot red-dot";

        }


        if (lights.eastWestDot) {

            lights.eastWestDot.className =
                signalPhase === "GREEN"
                    ? "signal-dot green-dot"
                    : "signal-dot yellow-dot";

        }

    }

}


// =========================================
// UPDATE COUNTDOWN
// =========================================

function updateCountdown() {

    const lights = getLights();


    if (lights.countdown) {

        lights.countdown.textContent =
            countdown;

    }

}


// =========================================
// START GREEN PHASE
// =========================================

function startGreenPhase() {

    /*
        IMPORTANT:

        Traffic is checked ONLY when
        starting a new signal cycle.
    */

    const nextDirection =
        chooseNextDirection();


    console.log(
        "NEXT DIRECTION:",
        nextDirection
    );


    if (nextDirection === "NS") {

        northSouthGreen();

    }

    else {

        eastWestGreen();

    }


    // Calculate new green duration

    greenDuration =
        calculateGreenTime(
            activeDirection
        );


    countdown =
        greenDuration;


    // Update traffic state

    if (
        typeof trafficState !== "undefined"
    ) {

        trafficState.currentGreenTime =
            greenDuration;

        trafficState.recommendedGreenTime =
            greenDuration;

    }


    updateCountdown();


    console.log(
        "GREEN TIME:",
        greenDuration,
        "seconds"
    );

}


// =========================================
// START YELLOW PHASE
// =========================================

function startYellowPhase() {

    countdown =
        YELLOW_TIME;


    if (activeDirection === "NS") {

        northSouthYellow();

    }

    else {

        eastWestYellow();

    }


    updateCountdown();

}


// =========================================
// TIMER
// =========================================

function tickSignal() {

    countdown--;


    updateCountdown();


    console.log(
        "SIGNAL:",
        activeDirection,
        signalPhase,
        countdown
    );


    // =====================================
    // GREEN FINISHED
    // =====================================

    if (
        signalPhase === "GREEN" &&
        countdown <= 0
    ) {

        startYellowPhase();

        return;

    }


    // =====================================
    // YELLOW FINISHED
    // =====================================

    if (
        signalPhase === "YELLOW" &&
        countdown <= 0
    ) {

        startGreenPhase();

    }

}


// =========================================
// START SYSTEM
// =========================================

function startSignalSystem() {

    console.log(
        "================================"
    );

    console.log(
        "SMARTFLOW SIGNAL SYSTEM STARTED"
    );

    console.log(
        "================================"
    );


    /*
        First signal
    */

    activeDirection = "EW";


    startGreenPhase();


    /*
        One timer only.
        Runs every 1 second.
    */

    if (signalTimer) {

        clearInterval(
            signalTimer
        );

    }


    signalTimer =
        setInterval(
            tickSignal,
            1000
        );

}


// =========================================
// WAIT FOR HTML
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        startSignalSystem();

    }
);