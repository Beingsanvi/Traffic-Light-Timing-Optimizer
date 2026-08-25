// =========================================================
// SMARTFLOW INTERACTIVE ANALYTICS
// =========================================================

let analyticsPaused = false;

let history = [];

const MAX_POINTS = 150;


// =========================================================
// METRICS
// =========================================================

const metrics = {

    density: {

        title:
            "Traffic Density Over Time",

        unit:
            "%",

        suffix:
            "%"

    },


    wait: {

        title:
            "Average Wait Time Over Time",

        unit:
            "seconds",

        suffix:
            "s"

    },


    vehicles: {

        title:
            "Vehicle Flow Over Time",

        unit:
            "vehicles/hour",

        suffix:
            ""

    },


    score: {

        title:
            "Optimization Score Over Time",

        unit:
            "%",

        suffix:
            "%"

    }

};


// =========================================================
// HELPER
// =========================================================

function setText(
    id,
    value
) {

    const element =
        document.getElementById(
            id
        );


    if (element) {

        element.textContent =
            value;

    }

}


// =========================================================
// GET TRAFFIC STATE
// =========================================================

function getTraffic() {

    if (
        typeof trafficState ===
        "undefined"
    ) {

        console.error(
            "trafficState not available"
        );

        return null;

    }


    return trafficState;

}


// =========================================================
// GET SELECTED METRIC
// =========================================================

function getMetric() {

    return (

        document.getElementById(
            "metricSelect"
        )?.value ||

        "density"

    );

}


// =========================================================
// GET SELECTED INTERSECTION
// =========================================================

function getIntersection() {

    return (

        document.getElementById(
            "intersectionSelect"
        )?.value ||

        "all"

    );

}


// =========================================================
// GET TIME RANGE
// =========================================================

function getTimeRange() {

    return Number(

        document.getElementById(
            "timeRange"
        )?.value ||

        30

    );

}


// =========================================================
// CALCULATE INTERSECTION METRIC
// =========================================================

function intersectionMetric(
    intersection,
    metric
) {

    if (!intersection) {

        return 0;

    }


    const total =

        Number(
            intersection.north || 0
        ) +

        Number(
            intersection.south || 0
        ) +

        Number(
            intersection.east || 0
        ) +

        Number(
            intersection.west || 0
        );


    // =====================================================
    // TRAFFIC DENSITY
    // =====================================================

    if (
        metric ===
        "density"
    ) {

        return Math.min(

            100,

            Math.round(

                (
                    total /
                    320
                ) *

                100

            )

        );

    }


    // =====================================================
    // WAIT TIME
    // =====================================================

    if (
        metric ===
        "wait"
    ) {

        const density =

            Math.round(

                (
                    total /
                    320
                ) *

                100

            );


        return Math.round(

            8 +

            density *
            0.45

        );

    }


    // =====================================================
    // VEHICLES
    // =====================================================

    if (
        metric ===
        "vehicles"
    ) {

        return total * 18;

    }


    // =====================================================
    // OPTIMIZATION SCORE
    // =====================================================

    const northSouth =

        Number(
            intersection.north || 0
        ) +

        Number(
            intersection.south || 0
        );


    const eastWest =

        Number(
            intersection.east || 0
        ) +

        Number(
            intersection.west || 0
        );


    const difference =

        Math.abs(

            northSouth -
            eastWest

        );


    return Math.max(

        45,

        Math.min(

            98,

            Math.round(

                100 -
                difference *
                0.4

            )

        )

    );

}


// =========================================================
// GET CURRENT VALUE
// =========================================================

function getCurrentValue() {

    const traffic =
        getTraffic();


    if (!traffic) {

        return 0;

    }


    const metric =
        getMetric();


    const selected =
        getIntersection();


    // =====================================================
    // ALL INTERSECTIONS
    // =====================================================

    if (
        selected ===
        "all"
    ) {

        if (
            metric ===
            "density"
        ) {

            return Number(

                traffic.density ||
                0

            );

        }


        if (
            metric ===
            "wait"
        ) {

            return Number(

                traffic.waitTime ||
                0

            );

        }


        if (
            metric ===
            "vehicles"
        ) {

            return Number(

                traffic.vehiclesPerHour ||
                0

            );

        }


        return Number(

            traffic.optimizationScore ||
            0

        );

    }


    // =====================================================
    // SPECIFIC INTERSECTION
    // =====================================================

    if (

        typeof intersectionNetwork ===
        "undefined"

    ) {

        return 0;

    }


    return intersectionMetric(

        intersectionNetwork[
            selected
        ],

        metric

    );

}


// =========================================================
// RECORD LIVE DATA
// =========================================================

function recordData() {

    if (
        analyticsPaused
    ) {

        return;

    }


    const value =
        getCurrentValue();


    history.push({

        time:
            Date.now(),

        value:
            value,

        metric:
            getMetric(),

        intersection:
            getIntersection()

    });


    if (
        history.length >
        MAX_POINTS
    ) {

        history.shift();

    }


    updateAnalytics();

}


// =========================================================
// GET VISIBLE HISTORY
// =========================================================

function getVisibleHistory() {

    const now =
        Date.now();


    const range =

        getTimeRange() *
        1000;


    const metric =
        getMetric();


    const intersection =
        getIntersection();


    return history.filter(

        point =>

            point.metric ===
            metric &&

            point.intersection ===
            intersection &&

            now -
            point.time <=
            range

    );

}


// =========================================================
// FORMAT VALUE
// =========================================================

function formatValue(
    value
) {

    const metric =
        getMetric();


    if (
        metric ===
        "vehicles"
    ) {

        return Math.round(
            value
        ).toLocaleString();

    }


    return (

        Math.round(
            value
        ) +

        metrics[
            metric
        ].suffix

    );

}


// =========================================================
// UPDATE SUMMARY
// =========================================================

function updateSummary() {

    const current =
        getCurrentValue();


    const data =
        getVisibleHistory();


    const values =

        data.map(

            item =>
                item.value

        );


    let average =
        current;


    let peak =
        current;


    if (
        values.length > 0
    ) {

        average =

            values.reduce(

                (
                    total,
                    value
                ) =>

                    total +
                    value,

                0

            ) /

            values.length;


        peak =

            Math.max(
                ...values
            );

    }


    setText(

        "currentMetric",

        formatValue(
            current
        )

    );


    setText(

        "metricUnit",

        metrics[
            getMetric()
        ].unit

    );


    setText(

        "averageMetric",

        formatValue(
            average
        )

    );


    setText(

        "peakMetric",

        formatValue(
            peak
        )

    );


    // =====================================================
    // TREND
    // =====================================================

    let trend =
        "STABLE";


    let description =
        "Traffic is stable";


    if (
        values.length >= 5
    ) {

        const first =

            values[
                values.length - 5
            ];


        const last =

            values[
                values.length - 1
            ];


        const change =
            last - first;


        const threshold =

            getMetric() ===
            "vehicles"

                ? 40

                : 2;


        if (
            change >
            threshold
        ) {

            trend =
                "↑ RISING";


            description =
                "Traffic is increasing";

        }


        else if (
            change <
            -threshold
        ) {

            trend =
                "↓ FALLING";


            description =
                "Traffic is decreasing";

        }

    }


    setText(

        "trendMetric",

        trend

    );


    setText(

        "trendDescription",

        description

    );

}


// =========================================================
// DRAW ANALYTICS GRAPH
// =========================================================

function drawChart() {

    const canvas =

        document.getElementById(
            "analyticsChart"
        );


    if (!canvas) {

        return;

    }


    const ctx =
        canvas.getContext(
            "2d"
        );


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    if (
        width <= 0 ||
        height <= 0
    ) {

        return;

    }


    const ratio =

        window.devicePixelRatio ||
        1;


    canvas.width =
        width * ratio;


    canvas.height =
        height * ratio;


    ctx.setTransform(

        ratio,
        0,
        0,
        ratio,
        0,
        0

    );


    ctx.clearRect(

        0,
        0,
        width,
        height

    );


    const data =
        getVisibleHistory();


    // =====================================================
    // EMPTY STATE
    // =====================================================

    if (
        data.length < 2
    ) {

        ctx.fillStyle =
            "#69757d";


        ctx.font =
            "13px Arial";


        ctx.fillText(

            "Collecting live traffic data...",

            25,

            height / 2

        );


        return;

    }


    const metric =
        getMetric();


    const max =

        metric ===
        "vehicles"

            ? Math.max(

                1000,

                ...data.map(

                    item =>
                        item.value

                )

            )

            : 100;


    const padding =
        40;


    const graphWidth =

        width -
        padding * 2;


    const graphHeight =

        height -
        padding * 2;


    // =====================================================
    // GRID
    // =====================================================

    ctx.strokeStyle =

        "rgba(255,255,255,0.07)";


    ctx.lineWidth =
        1;


    for (
        let i = 0;
        i <= 4;
        i++
    ) {

        const y =

            padding +

            graphHeight *
            (
                i / 4
            );


        ctx.beginPath();


        ctx.moveTo(

            padding,
            y

        );


        ctx.lineTo(

            width -
            padding,

            y

        );


        ctx.stroke();

    }


    // =====================================================
    // GRAPH LINE
    // =====================================================

    ctx.beginPath();


    data.forEach(

        (
            point,
            index
        ) => {

            const x =

                padding +

                (
                    index /
                    (
                        data.length -
                        1
                    )
                ) *

                graphWidth;


            const y =

                padding +

                graphHeight -

                (

                    point.value /
                    max

                ) *

                graphHeight;


            if (
                index === 0
            ) {

                ctx.moveTo(
                    x,
                    y
                );

            }


            else {

                ctx.lineTo(
                    x,
                    y
                );

            }

        }

    );


    ctx.strokeStyle =
        "#00F5A0";


    ctx.lineWidth =
        3;


    ctx.stroke();


    // =====================================================
    // DATA POINTS
    // =====================================================

    data.forEach(

        (
            point,
            index
        ) => {

            const x =

                padding +

                (
                    index /
                    (
                        data.length -
                        1
                    )
                ) *

                graphWidth;


            const y =

                padding +

                graphHeight -

                (

                    point.value /
                    max

                ) *

                graphHeight;


            ctx.beginPath();


            ctx.arc(

                x,
                y,
                3,
                0,
                Math.PI * 2

            );


            ctx.fillStyle =
                "#00F5A0";


            ctx.fill();

        }

    );


    // =====================================================
    // Y AXIS
    // =====================================================

    ctx.fillStyle =
        "#71808a";


    ctx.font =
        "10px Arial";


    ctx.fillText(

        max +

        (

            metric ===
            "vehicles"

                ? ""

                : "%"

        ),

        8,

        padding

    );


    ctx.fillText(

        "0",

        20,

        height -
        padding

    );

}


// =========================================================
// UPDATE CHART TITLE
// =========================================================

function updateTitle() {

    const metric =
        getMetric();


    const intersection =
        getIntersection();


    let name =
        "All Intersections";


    if (

        intersection !==
        "all" &&

        typeof intersectionNetwork !==
        "undefined"

    ) {

        name =

            intersectionNetwork[
                intersection
            ]?.name ||

            intersection;

    }


    setText(

        "chartTitle",

        metrics[
            metric
        ].title +

        " · " +

        name

    );

}


// =========================================================
// UPDATE TRAFFIC INSIGHTS
// =========================================================

function updateInsights() {

    const traffic =
        getTraffic();


    if (!traffic) {

        return;

    }


    const northSouth =

        Number(
            traffic.north || 0
        ) +

        Number(
            traffic.south || 0
        );


    const eastWest =

        Number(
            traffic.east || 0
        ) +

        Number(
            traffic.west || 0
        );


    const priority =

        northSouth >=
        eastWest

            ? "NORTH / SOUTH"

            : "EAST / WEST";


    setText(

        "priorityDirection",

        priority

    );


    // =====================================================
    // BUSIEST INTERSECTION
    // =====================================================

    if (

        typeof intersectionNetwork !==
        "undefined"

    ) {

        let busiest =
            null;


        Object.values(

            intersectionNetwork

        ).forEach(

            intersection => {

                const density =

                    Number(

                        intersection.density ||
                        0

                    );


                if (

                    !busiest ||

                    density >

                    Number(
                        busiest.density ||
                        0
                    )

                ) {

                    busiest =
                        intersection;

                }

            }

        );


        if (busiest) {

            setText(

                "busiestIntersection",

                busiest.name

            );


            setText(

                "peakLoad",

                Number(

                    busiest.density ||
                    0

                ) + "%"

            );

        }

    }


    // =====================================================
    // TRAFFIC CONDITION
    // =====================================================

    const density =

        Number(
            traffic.density ||
            0
        );


    if (
        density >= 70
    ) {

        setText(

            "insightTitle",

            "High congestion detected"

        );


        setText(

            "insightText",

            priority +

            " currently has the higher traffic load. " +

            "SmartFlow should prioritize this phase."

        );

    }


    else if (
        density >= 45
    ) {

        setText(

            "insightTitle",

            "Moderate traffic detected"

        );


        setText(

            "insightText",

            "Traffic is building gradually. " +

            "Adaptive signal timing can balance the flow."

        );

    }


    else {

        setText(

            "insightTitle",

            "Traffic flow is healthy"

        );


        setText(

            "insightText",

            "Traffic is currently within a manageable range."

        );

    }

}


// =========================================================
// INTERSECTION PERFORMANCE
// =========================================================

function updateComparison() {

    const container =

        document.getElementById(
            "intersectionComparison"
        );


    if (

        !container ||

        typeof intersectionNetwork ===
        "undefined"

    ) {

        return;

    }


    container.innerHTML =
        "";


    Object.values(

        intersectionNetwork

    ).forEach(

        intersection => {

            const density =

                Number(

                    intersection.density ||
                    0

                );


            const score =

                Number(

                    intersection.optimizationScore ||
                    0

                );


            const row =

                document.createElement(
                    "div"
                );


            row.className =
                "intersection-performance";


            row.innerHTML = `

                <div class="performance-name">

                    <strong>
                        ${intersection.name}
                    </strong>

                    <small>
                        ${density}% traffic load
                    </small>

                </div>


                <div class="performance-bar">

                    <span
                        style="width:${density}%"
                    ></span>

                </div>


                <strong class="performance-score">

                    ${score}%

                </strong>

            `;


            container.appendChild(
                row
            );

        }

    );

}


// =========================================================
// OPTIMIZATION PERFORMANCE
// =========================================================

function updateOptimizationPerformance() {

    const traffic =
        getTraffic();


    if (!traffic) {

        return;

    }


    // =====================================================
    // BASELINE
    // =====================================================

    const beforeScore =
        61;


    // =====================================================
    // CURRENT LIVE SCORE
    // =====================================================

    const currentScore =

        Math.round(

            Number(

                traffic.optimizationScore ||
                0

            )

        );


    // =====================================================
    // IMPROVEMENT
    // =====================================================

    const improvement =

        currentScore -
        beforeScore;


    const improvementText =

        (

            improvement >= 0

                ? "+"

                : ""

        ) +

        improvement +

        "%";


    // =====================================================
    // OLD BEFORE / AFTER SECTION
    // =====================================================

    setText(

        "afterDensity",

        Math.round(

            Number(
                traffic.density ||
                0
            )

        ) + "%"

    );


    setText(

        "afterWait",

        Math.round(

            Number(
                traffic.waitTime ||
                0
            )

        ) + "s"

    );


    setText(

        "afterScore",

        currentScore + "%"

    );


    // =====================================================
    // IMPORTANT:
    // THESE ARE THE IDS USED BY THE NEW BOTTOM SECTION
    // =====================================================

    setText(

        "beforeValue",

        beforeScore + "%"

    );


    setText(

        "afterValue",

        currentScore + "%"

    );


    setText(

        "improvementValue",

        improvementText

    );


    // =====================================================
    // SUPPORT FOR ALTERNATIVE IDS
    // =====================================================

    const beforeIds = [

        "beforeOptimization",

        "beforeOptimizationValue",

        "optimizationBefore",

        "beforePerformance",

        "beforePerformanceValue"

    ];


    const currentIds = [

        "currentOptimization",

        "currentOptimizationValue",

        "optimizationCurrent",

        "currentPerformance",

        "currentPerformanceValue"

    ];


    const improvementIds = [

        "optimizationImprovement",

        "improvementOptimization",

        "improvementPerformance",

        "improvementPerformanceValue",

        "optimizationGain"

    ];


    beforeIds.forEach(

        id => {

            setText(

                id,

                beforeScore + "%"

            );

        }

    );


    currentIds.forEach(

        id => {

            setText(

                id,

                currentScore + "%"

            );

        }

    );


    improvementIds.forEach(

        id => {

            setText(

                id,

                improvementText

            );

        }

    );


    // =====================================================
    // CONSOLE CHECK
    // =====================================================

    console.log(

        "Optimization Performance:",

        {

            before:
                beforeScore + "%",

            current:
                currentScore + "%",

            improvement:
                improvementText

        }

    );

}


// =========================================================
// MAIN ANALYTICS UPDATE
// =========================================================

function updateAnalytics() {

    updateSummary();


    updateTitle();


    updateInsights();


    updateComparison();


    updateOptimizationPerformance();


    drawChart();

}


// =========================================================
// RESET ANALYTICS
// =========================================================

function resetAnalytics() {

    history = [];


    recordData();

}


// =========================================================
// PAUSE / RESUME LIVE DATA
// =========================================================

function togglePause() {

    analyticsPaused =
        !analyticsPaused;


    const button =

        document.getElementById(
            "pauseAnalytics"
        );


    const status =

        document.getElementById(
            "chartStatus"
        );


    if (
        analyticsPaused
    ) {

        if (button) {

            button.textContent =
                "▶ Resume Live Data";

        }


        if (status) {

            status.textContent =
                "● PAUSED";

        }

    }


    else {

        if (button) {

            button.textContent =
                "⏸ Pause Live Data";

        }


        if (status) {

            status.textContent =
                "● LIVE";

        }


        recordData();

    }

}


// =========================================================
// INITIALIZE ANALYTICS
// =========================================================

document.addEventListener(

    "DOMContentLoaded",

    function () {


        console.log(

            "SmartFlow Interactive Analytics Loaded"

        );


        const metric =

            document.getElementById(
                "metricSelect"
            );


        const intersection =

            document.getElementById(
                "intersectionSelect"
            );


        const range =

            document.getElementById(
                "timeRange"
            );


        const pause =

            document.getElementById(
                "pauseAnalytics"
            );


        // =================================================
        // METRIC CHANGE
        // =================================================

        if (metric) {

            metric.addEventListener(

                "change",

                resetAnalytics

            );

        }


        // =================================================
        // INTERSECTION CHANGE
        // =================================================

        if (intersection) {

            intersection.addEventListener(

                "change",

                resetAnalytics

            );

        }


        // =================================================
        // TIME RANGE CHANGE
        // =================================================

        if (range) {

            range.addEventListener(

                "change",

                resetAnalytics

            );

        }


        // =================================================
        // PAUSE BUTTON
        // =================================================

        if (pause) {

            pause.addEventListener(

                "click",

                togglePause

            );

        }


        // =================================================
        // INITIAL DATA
        // =================================================

        for (

            let i = 0;

            i < 5;

            i++

        ) {

            recordData();

        }


        // =================================================
        // LIVE DATA EVERY 2 SECONDS
        // =================================================

        setInterval(

            recordData,

            2000

        );


        // =================================================
        // REDRAW WHEN WINDOW RESIZES
        // =================================================

        window.addEventListener(

            "resize",

            drawChart

        );

    }

);