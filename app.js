const map = L.map("map", {
    preferCanvas: true
}).setView([39.8, -98.6], 4);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

document.getElementById("legend").innerHTML = `
    <h3 style="text-align:center;margin:0 0 14px 0;">Average Daily Max WBGT</h3>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#6a00a8;border:1px solid #333;border-radius:4px;"></span>
        <span>&lt; 6°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#08306b;border:1px solid #333;border-radius:4px;"></span>
        <span>6 – 10°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#6baed6;border:1px solid #333;border-radius:4px;"></span>
        <span>10.1 – 13.9°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#31a354;border:1px solid #333;border-radius:4px;"></span>
        <span>14 – 15.9°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#fdae61;border:1px solid #333;border-radius:4px;"></span>
        <span>16 – 20°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#f46d43;border:1px solid #333;border-radius:4px;"></span>
        <span>20.1 – 23.9°C</span>
    </div>

    <div style="display:grid;grid-template-columns:28px auto;column-gap:14px;align-items:center;margin:8px 0;">
        <span style="display:block;width:22px;height:22px;background:#a50026;border:1px solid #333;border-radius:4px;"></span>
        <span>≥ 24°C</span>
    </div>
`;

function getGeoID(feature) {
    const p = feature.properties || {};

    if (p.GEOID) return String(p.GEOID).padStart(5, "0");
    if (p.GEOIDFQ) return String(p.GEOIDFQ).slice(-5);

    if (p.STATEFP && p.COUNTYFP) {
        return (
            String(p.STATEFP).padStart(2, "0") +
            String(p.COUNTYFP).padStart(3, "0")
        );
    }

    if (feature.id) return String(feature.id).padStart(5, "0");

    return null;
}


function wbgtColor(value) {
    const wbgt = Number(value);

    if (Number.isNaN(wbgt)) return "#ffffff";

    if (wbgt < 6) return "#6a00a8";
    if (wbgt <= 10) return "#08306b";
    if (wbgt < 14) return "#6baed6";
    if (wbgt < 16) return "#31a354";
    if (wbgt <= 20) return "#fdae61";
    if (wbgt < 24) return "#f46d43";

    return "#a50026";
}


function wbgtLabel(value) {
    const wbgt = Number(value);

    if (Number.isNaN(wbgt)) return "No data";
    if (wbgt < 6) return "< 6°C / no data";
    if (wbgt <= 10) return "6–10°C";
    if (wbgt < 14) return "10.1–13.9°C";
    if (wbgt < 16) return "14–15.9°C";
    if (wbgt <= 20) return "16–20°C";
    if (wbgt < 24) return "20.1–23.9°C";

    return "≥ 24°C";
}


function n(value, digits = 1) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "N/A";
    }

    return Number(value).toFixed(digits);
}


function updateSidebar(county) {
    const wbgt = county.avg_daily_max_wbgt_c;

    const estimateNotice = county.estimated
        ? `
            <div class="explainer warning">
                <strong>Estimated county data</strong><br>
                This county had no direct weather-station result. Values were averaged from
                ${county.neighbor_count} surrounding counties.
            </div>
        `
        : `
            <div class="explainer">
                <strong>Measured county data</strong><br>
                This county used a direct weather-station result.
            </div>
        `;

    document.getElementById("sidebar-content").innerHTML = `
        <h2>${county.name}</h2>

        <h3>Average Daily Max WBGT: ${n(wbgt, 2)}°C</h3>
        <p><strong>WBGT Category:</strong> ${wbgtLabel(wbgt)}</p>

        ${estimateNotice}

        <hr>

        <div class="metric">
            <div class="metric-label">Heat Burden Days / Year</div>
            ${n(county.hot_days_per_year)}
        </div>

        <div class="metric">
            <div class="metric-label">Cold Burden Days / Year</div>
            ${n(county.cold_days_per_year)}
        </div>

        <div class="metric">
            <div class="metric-label">Cloud Burden Days Equivalent</div>
            ${n(county.cloud_burden)}
        </div>

        <div class="metric">
            <div class="metric-label">Sunny Days / Year</div>
            ${n(county.sunny_days_per_year)}
        </div>

        <div class="metric">
            <div class="metric-label">Pleasant Days / Year</div>
            ${n(county.pleasant_days_per_year)}
        </div>

        <hr>

        <div class="metric">
            <div class="metric-label">Total Climate Burden</div>
            ${n(county.burden)}
        </div>

        <div class="metric">
            <div class="metric-label">Average Daily Min Wind Chill</div>
            ${n(county.avg_daily_min_windchill_f, 2)}°F
        </div>

        <div class="explainer">
            <strong>Current map mode:</strong><br>
            County color is based only on Average Daily Max WBGT.
        </div>
    `;
}


Promise.all([
    fetch("counties.geojson").then(response => response.json()),
    fetch("county_lookup.json").then(response => response.json())
])
.then(([geojson, lookup]) => {
    const countyLayer = L.geoJSON(geojson, {
        style: function(feature) {
            const geoid = getGeoID(feature);
            const county = geoid ? lookup[geoid] : null;
            const wbgt = county ? county.avg_daily_max_wbgt_c : null;

            return {
                fillColor: county ? wbgtColor(wbgt) : "#ffffff",
                color: "#222222",
                weight: map.getZoom() >= 6 ? 0.8 : 0.3,
                fillOpacity: county ? 0.84 : 0.25
            };
        },

        onEachFeature: function(feature, layer) {
            const geoid = getGeoID(feature);
            const county = geoid ? lookup[geoid] : null;

            if (!county) {
                layer.bindTooltip("No climate data");
                return;
            }

            layer.bindTooltip(
                `<strong>${county.name}</strong><br>
                 Avg Max WBGT: ${n(county.avg_daily_max_wbgt_c, 2)}°C<br>
                 Category: ${wbgtLabel(county.avg_daily_max_wbgt_c)}`,
                { className: "county-tooltip" }
            );

            layer.on("click", function() {
                updateSidebar(county);
            });

            layer.on("mouseover", function() {
                layer.setStyle({
                    weight: 1.8,
                    color: "#000000",
                    fillOpacity: 0.96
                });
            });

            layer.on("mouseout", function() {
                countyLayer.resetStyle(layer);
            });
        }
    }).addTo(map);

    // Start centered on the contiguous United States
    const lower48Bounds = [
        [24.4, -125.0], // southwest
        [49.4, -66.9]   // northeast
    ];

    map.fitBounds(lower48Bounds, {
        padding: [20, 20]
    });

    map.on("zoomend", function() {
        countyLayer.setStyle(function(feature) {
            const geoid = getGeoID(feature);
            const county = geoid ? lookup[geoid] : null;
            const wbgt = county ? county.avg_daily_max_wbgt_c : null;

            return {
                fillColor: county ? wbgtColor(wbgt) : "#ffffff",
                color: "#222222",
                weight: map.getZoom() >= 6 ? 0.8 : 0.3,
                fillOpacity: county ? 0.84 : 0.25
            };
        });
    });

    fetch("https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json")
        .then(response => response.json())
        .then(statesGeojson => {
            L.geoJSON(statesGeojson, {
                style: {
                    fillOpacity: 0,
                    color: "#111111",
                    weight: 2.2,
                    opacity: 0.95,
                    interactive: false
                }
            }).addTo(map);
        });
})
.catch(error => {
    console.error("Map load failed:", error);
});
