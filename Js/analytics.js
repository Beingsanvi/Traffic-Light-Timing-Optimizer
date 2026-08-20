// =========================================
// SMARTFLOW ANALYTICS ENGINE
// =========================================

let densityHistory = [];
let maxHistoryPoints = 20;


// =========================================
// UPDATE ANALYTICS
// =========================================

function updateAnalytics() {

    // Make sure traffic.js is loaded
    if (typeof trafficState === "undefined") {
        return;
    }


    // =====================================
    // KPI CARDS
    // =====================================

    const density =
        document.getElementById("analyticsDensity");

    const vehicles =
        document.getElementById("analyticsVehicles");

    const wait =
        document.getElementById("analyticsWait");

    const score =
        document.getElementById("analyticsScore");


    if (density) {
        density.textContent =
            trafficState.density + "%";
    }


    if (vehicles) {
        vehicles.textContent =
            trafficState.vehiclesPerHour.toLocaleString();
    }


    if (wait) {
        wait.textContent =
            trafficState.waitTime + "s";
    }


    if (score) {
        score.textContent =
            trafficState.optimizationScore + "%";
    }


    // =====================================
    // DIRECTIONAL TRAFFIC
    // =====================================

    updateAnalyticsDirection(
        "northValue",
        "northBar",
        trafficState.north
    );


    updateAnalyticsDirection(
        "southValue",
        "southBar",
        trafficState.south
    );


    updateAnalyticsDirection(
        "eastValue",
        "eastBar",
        trafficState.east
    );


    updateAnalyticsDirection(
        "westValue",
        "westBar",
        trafficState.west
    );


    // =====================================
    // BEFORE VS AFTER
    // =====================================

    const afterDensity =
        document.getElementById("afterDensity");

    const afterWait =
        document.getElementById("afterWait");

    const afterScore =
        document.getElementById("afterScore");


    if (afterDensity) {

        afterDensity.textContent =
            trafficState.density + "%";

    }


    if (afterWait) {

        afterWait.textContent =
            trafficState.waitTime + "s";

    }


    if (afterScore) {

        afterScore.textContent =
            trafficState.optimizationScore + "%";

    }


    // =====================================
    // SIGNAL PERFORMANCE
    // =====================================

    const analyticsGreen =
        document.getElementById(
            "analyticsGreen"
        );


    const analyticsPhase =
        document.getElementById(
            "analyticsPhase"
        );


    const signalChanges =
        document.getElementById(
            "signalChanges"
        );


    if (analyticsGreen) {

        analyticsGreen.textContent =
            trafficState.recommendedGreenTime +
            "s";

    }


    if (analyticsPhase) {

        if (
            trafficState.currentPhase === "NS"
        ) {

            analyticsPhase.textContent =
                "NORTH / SOUTH";

        }

        else {

            analyticsPhase.textContent =
                "EAST / WEST";

        }

    }


    if (signalChanges) {

        /*
            signalChangeCount is created
            by traffic.js.
        */

        if (
            typeof signalChangeCount !==
            "undefined"
        ) {

            signalChanges.textContent =
                signalChangeCount;

        }

    }


    // =====================================
    // CHART DATA
    // =====================================

    densityHistory.push(
        trafficState.density
    );


    if (
        densityHistory.length >
        maxHistoryPoints
    ) {

        densityHistory.shift();

    }


    drawTrafficChart();

}


// =========================================
// UPDATE DIRECTION
// =========================================

function updateAnalyticsDirection(
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

        /*
            Maximum simulated traffic
            per direction = 80.
        */

        const percentage =
            Math.min(
                100,
                (value / 80) * 100
            );


        barElement.style.width =
            percentage + "%";

    }

}


// =========================================
// DRAW TRAFFIC CHART
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


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    /*
        Make canvas match display size.
    */

    const ratio =
        window.devicePixelRatio || 1;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    ctx.scale(
        ratio,
        ratio
    );


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    // =====================================
    // CHART SETTINGS
    // =====================================

    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 20;
    const paddingBottom = 35;


    const chartWidth =
        width -
        paddingLeft -
        paddingRight;


    const chartHeight =
        height -
        paddingTop -
        paddingBottom;


    // =====================================
    // GRID
    // =====================================

    ctx.font =
        "11px Arial";


    ctx.textAlign =
        "right";


    ctx.textBaseline =
        "middle";


    for (
        let value = 0;
        value <= 100;
        value += 20
    ) {

        const y =
            paddingTop +
            chartHeight -
            (value / 100) *
            chartHeight;


        ctx.beginPath();


        ctx.moveTo(
            paddingLeft,
            y
        );


        ctx.lineTo(
            width - paddingRight,
            y
        );


        ctx.strokeStyle =
            "rgba(255,255,255,0.08)";


        ctx.stroke();


        ctx.fillStyle =
            "rgba(255,255,255,0.55)";


        ctx.fillText(
            value + "%",
            paddingLeft - 8,
            y
        );

    }


    // =====================================
    // NO DATA
    // =====================================

    if (
        densityHistory.length === 0
    ) {

        return;

    }


    // =====================================
    // CREATE POINTS
    // =====================================

    const points = [];


    densityHistory.forEach(
        (value, index) => {

            let x;


            if (
                densityHistory.length === 1
            ) {

                x =
                    paddingLeft +
                    chartWidth / 2;

            }

            else {

                x =
                    paddingLeft +
                    (
                        index /
                        (densityHistory.length - 1)
                    ) *
                    chartWidth;

            }


            const y =
                paddingTop +
                chartHeight -
                (value / 100) *
                chartHeight;


            points.push({
                x: x,
                y: y,
                value: value
            });

        }
    );


    // =====================================
    // DRAW LINE
    // =====================================

    ctx.beginPath();


    points.forEach(
        (point, index) => {

            if (index === 0) {

                ctx.moveTo(
                    point.x,
                    point.y
                );

            }

            else {

                ctx.lineTo(
                    point.x,
                    point.y
                );

            }

        }
    );


    ctx.strokeStyle =
        "#39d98a";


    ctx.lineWidth =
        3;


    ctx.stroke();


    // =====================================
    // DRAW POINTS
    // =====================================

    points.forEach(
        point => {

            ctx.beginPath();


            ctx.arc(
                point.x,
                point.y,
                4,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "#39d98a";


            ctx.fill();

        }
    );


    // =====================================
    // CURRENT VALUE
    // =====================================

    const latest =
        points[points.length - 1];


    if (latest) {

        ctx.font =
            "bold 12px Arial";


        ctx.textAlign =
            "left";


        ctx.fillStyle =
            "#ffffff";


        ctx.fillText(
            latest.value + "%",
            latest.x + 8,
            latest.y - 10
        );

    }

}


// =========================================
// CHART STATUS
// =========================================

function updateChartStatus() {

    const status =
        document.getElementById(
            "chartStatus"
        );


    if (status) {

        status.textContent =
            "LIVE";

    }

}


// =========================================
// INITIALIZE
// =========================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        /*
            First update immediately.
        */

        updateAnalytics();

        updateChartStatus();


        /*
            Refresh analytics every second.
            traffic.js remains responsible
            for actually changing traffic.
        */

        setInterval(
            updateAnalytics,
            1000
        );

    }
);


// =========================================
// RESIZE CHART
// =========================================

window.addEventListener(
    "resize",
    function () {

        drawTrafficChart();

    }
);