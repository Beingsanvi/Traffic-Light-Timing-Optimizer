// =========================================
// SMARTFLOW ANALYTICS
// =========================================

console.log("SmartFlow Analytics Loaded");


// =========================================
// GET TRAFFIC DATA
// =========================================

function getTrafficState() {

    const savedData =
        localStorage.getItem("smartflowTrafficState");

    if (!savedData) {
        return null;
    }

    try {

        return JSON.parse(savedData);

    } catch (error) {

        console.error(
            "Error reading SmartFlow data:",
            error
        );

        return null;
    }
}



// =========================================
// UPDATE ANALYTICS
// =========================================

function updateAnalytics() {

    const data = getTrafficState();

    if (!data) {

        console.log(
            "Waiting for traffic data..."
        );

        return;
    }


    // =====================================
    // 1. TRAFFIC DENSITY
    // =====================================

    const densityElement =
        document.getElementById(
            "analyticsDensity"
        );

    if (densityElement) {

        densityElement.textContent =
            Math.round(data.density) + "%";

    }



    // =====================================
    // 2. VEHICLES / HOUR
    // =====================================

    const vehicleElement =
        document.getElementById(
            "analyticsVehicles"
        );

    if (vehicleElement) {

        vehicleElement.textContent =
            Number(
                data.vehiclesPerHour
            ).toLocaleString();

    }



    // =====================================
    // 3. WAIT TIME
    // =====================================

    const waitElement =
        document.getElementById(
            "analyticsWait"
        );

    if (waitElement) {

        waitElement.textContent =
            data.waitTime;

    }



    // =====================================
    // 4. OPTIMIZATION SCORE
    // =====================================

    const scoreElement =
        document.getElementById(
            "analyticsScore"
        );

    if (scoreElement) {

        scoreElement.textContent =
            data.optimizationScore;

    }



    // =====================================
    // 5. DIRECTIONAL TRAFFIC
    // =====================================

    updateDirection(
        "north",
        data.traffic.north
    );

    updateDirection(
        "south",
        data.traffic.south
    );

    updateDirection(
        "east",
        data.traffic.east
    );

    updateDirection(
        "west",
        data.traffic.west
    );



    // =====================================
    // 6. BEFORE VS AFTER
    // =====================================

    updateBeforeAfter(data);



    // =====================================
    // 7. SIGNAL PERFORMANCE
    // =====================================

    const greenElement =
        document.getElementById(
            "analyticsGreen"
        );

    if (greenElement) {

        greenElement.textContent =
            data.recommendedGreenTime + "s";

    }


    const phaseElement =
        document.getElementById(
            "analyticsPhase"
        );

    if (phaseElement) {

        phaseElement.textContent =
            data.currentDirection;

    }


    const changesElement =
        document.getElementById(
            "signalChanges"
        );

    if (changesElement) {

        changesElement.textContent =
            data.signalChanges;

    }



    // =====================================
    // 8. GRAPH
    // =====================================

    saveDensityHistory(
        data.density
    );

    drawTrafficChart();

}



// =========================================
// UPDATE DIRECTION
// =========================================

function updateDirection(
    direction,
    value
) {

    const valueElement =
        document.getElementById(
            direction + "Value"
        );

    const barElement =
        document.getElementById(
            direction + "Bar"
        );


    if (valueElement) {

        valueElement.textContent =
            value;

    }


    if (barElement) {

        /*
            Traffic values are treated
            as percentages for the
            visual traffic bars.
        */

        const percentage =
            Math.min(
                Number(value),
                100
            );

        barElement.style.width =
            percentage + "%";

    }

}



// =========================================
// BEFORE VS AFTER
// =========================================

function updateBeforeAfter(data) {

    const afterDensity =
        document.getElementById(
            "afterDensity"
        );

    const afterWait =
        document.getElementById(
            "afterWait"
        );

    const afterScore =
        document.getElementById(
            "afterScore"
        );


    if (afterDensity) {

        afterDensity.textContent =
            Math.round(data.density) + "%";

    }


    if (afterWait) {

        afterWait.textContent =
            data.waitTime;

    }


    if (afterScore) {

        afterScore.textContent =
            data.optimizationScore;

    }

}



// =========================================
// DENSITY HISTORY
// =========================================

function saveDensityHistory(
    density
) {

    let history =
        JSON.parse(
            localStorage.getItem(
                "smartflowDensityHistory"
            )
        );


    if (!Array.isArray(history)) {

        history = [];

    }


    /*
        Don't add unlimited points.
    */

    history.push({

        density:
            Number(density),

        time:
            new Date().toLocaleTimeString()

    });


    /*
        Keep last 30 readings.
    */

    if (history.length > 30) {

        history.shift();

    }


    localStorage.setItem(
        "smartflowDensityHistory",
        JSON.stringify(history)
    );

}



// =========================================
// DRAW TRAFFIC GRAPH
// =========================================

function drawTrafficChart() {

    const canvas =
        document.getElementById(
            "trafficChart"
        );


    if (!canvas) {

        return;

    }


    const ctx =
        canvas.getContext("2d");


    const history =
        JSON.parse(
            localStorage.getItem(
                "smartflowDensityHistory"
            )
        ) || [];


    if (history.length < 2) {

        return;

    }


    /*
        Canvas size
    */

    const width =
        canvas.clientWidth;

    const height =
        canvas.clientHeight;


    if (
        canvas.width !==
        width
    ) {

        canvas.width = width;

    }


    if (
        canvas.height !==
        height
    ) {

        canvas.height = height;

    }


    // Clear graph

    ctx.clearRect(
        0,
        0,
        width,
        height
    );



    // =====================================
    // GRID
    // =====================================

    ctx.strokeStyle =
        "rgba(255,255,255,0.08)";

    ctx.lineWidth = 1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =
            height -
            (i / 4) * height;


        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            width,
            y
        );

        ctx.stroke();

    }



    // =====================================
    // TRAFFIC LINE
    // =====================================

    ctx.beginPath();


    history.forEach(
        (item, index) => {

            const x =
                (
                    index /
                    (history.length - 1)
                ) * width;


            const y =
                height -
                (
                    Number(item.density) /
                    100
                ) * height;


            if (index === 0) {

                ctx.moveTo(
                    x,
                    y
                );

            } else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }
    );


    ctx.strokeStyle =
        "#00F5A0";

    ctx.lineWidth = 3;

    ctx.stroke();



    // =====================================
    // POINTS
    // =====================================

    history.forEach(
        (item, index) => {

            const x =
                (
                    index /
                    (history.length - 1)
                ) * width;


            const y =
                height -
                (
                    Number(item.density) /
                    100
                ) * height;


            ctx.beginPath();

            ctx.arc(
                x,
                y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#00F5A0";

            ctx.fill();

        }
    );

}



// =========================================
// FIRST LOAD
// =========================================

updateAnalytics();



// =========================================
// UPDATE EVERY SECOND
// =========================================

setInterval(
    updateAnalytics,
    1000
);



// =========================================
// UPDATE WHEN LOCAL STORAGE CHANGES
// =========================================

window.addEventListener(
    "storage",
    function(event) {

        if (
            event.key ===
            "smartflowTrafficState"
        ) {

            updateAnalytics();

        }

    }
);