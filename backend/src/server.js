const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const stations = [
    {
        id: 1,
        name: "VoltWay Central",
        city: "Hyderabad",
        address: "Hitech City, Hyderabad",
        latitude: 17.4435,
        longitude: 78.3772,
        chargerType: "DC Fast",
        power: 60,
        connector: "CCS2",
        pricePerKwh: 18,
        available: true
    },
    {
        id: 2,
        name: "GreenCharge Hub",
        city: "Hyderabad",
        address: "Gachibowli, Hyderabad",
        latitude: 17.4401,
        longitude: 78.3489,
        chargerType: "AC",
        power: 22,
        connector: "Type 2",
        pricePerKwh: 12,
        available: true
    },
    {
        id: 3,
        name: "EcoDrive Fast Station",
        city: "Hyderabad",
        address: "Kukatpally, Hyderabad",
        latitude: 17.4849,
        longitude: 78.4138,
        chargerType: "DC Fast",
        power: 120,
        connector: "CCS2",
        pricePerKwh: 20,
        available: false
    },
    {
        id: 4,
        name: "Urban EV Point",
        city: "Hyderabad",
        address: "Madhapur, Hyderabad",
        latitude: 17.4483,
        longitude: 78.3915,
        chargerType: "AC",
        power: 11,
        connector: "Type 2",
        pricePerKwh: 10,
        available: true
    },
    {
        id: 5,
        name: "RapidVolt Charging",
        city: "Hyderabad",
        address: "Financial District, Hyderabad",
        latitude: 17.4140,
        longitude: 78.3400,
        chargerType: "DC Fast",
        power: 60,
        connector: "CCS2",
        pricePerKwh: 17,
        available: true
    }
];

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "VoltWay EV Explorer API is running"
    });
});

app.get("/api/stations", (req, res) => {
    const { search, chargerType, available } = req.query;

    let result = [...stations];

    if (search) {
        const query = String(search).toLowerCase();

        result = result.filter(station =>
            station.name.toLowerCase().includes(query) ||
            station.city.toLowerCase().includes(query) ||
            station.address.toLowerCase().includes(query)
        );
    }

    if (chargerType && chargerType !== "All") {
        result = result.filter(
            station => station.chargerType === chargerType
        );
    }

    if (available === "true") {
        result = result.filter(station => station.available);
    }

    res.json({
        success: true,
        count: result.length,
        data: result
    });
});

app.get("/api/stations/:id", (req, res) => {
    const station = stations.find(
        item => item.id === Number(req.params.id)
    );

    if (!station) {
        return res.status(404).json({
            success: false,
            message: "Charging station not found"
        });
    }

    res.json({
        success: true,
        data: station
    });
});

app.post("/api/stations", (req, res) => {
    const {
        name,
        city,
        address,
        latitude,
        longitude,
        chargerType,
        power,
        connector,
        pricePerKwh
    } = req.body;

    if (
        !name ||
        !city ||
        !address ||
        !chargerType ||
        !connector ||
        !Number.isFinite(Number(latitude)) ||
        !Number.isFinite(Number(longitude)) ||
        !Number.isFinite(Number(power)) ||
        !Number.isFinite(Number(pricePerKwh)) ||
        Number(latitude) < -90 ||
        Number(latitude) > 90 ||
        Number(longitude) < -180 ||
        Number(longitude) > 180 ||
        Number(power) <= 0 ||
        Number(pricePerKwh) < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Please provide valid station details"
        });
    }

    const station = {
        id: Math.max(0, ...stations.map(item => item.id)) + 1,
        name: String(name).trim(),
        city: String(city).trim(),
        address: String(address).trim(),
        latitude: Number(latitude),
        longitude: Number(longitude),
        chargerType: String(chargerType),
        power: Number(power),
        connector: String(connector),
        pricePerKwh: Number(pricePerKwh),
        available: true
    };

    stations.push(station);

    res.status(201).json({
        success: true,
        message: "Charging station added successfully",
        data: station
    });
});

app.put("/api/stations/:id", (req, res) => {
    const station = stations.find(
        item => item.id === Number(req.params.id)
    );

    if (!station) {
        return res.status(404).json({
            success: false,
            message: "Charging station not found"
        });
    }

    const fields = [
        "name",
        "city",
        "address",
        "latitude",
        "longitude",
        "chargerType",
        "power",
        "connector",
        "pricePerKwh",
        "available"
    ];

    const numericFields = [
        "latitude",
        "longitude",
        "power",
        "pricePerKwh"
    ];

    for (const field of fields) {
        if (req.body[field] === undefined) {
            continue;
        }

        if (numericFields.includes(field)) {
            const value = Number(req.body[field]);

            if (!Number.isFinite(value)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid value for ${field}`
                });
            }

            station[field] = value;
        } else if (field === "available") {
            if (typeof req.body[field] !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "Availability must be true or false"
                });
            }

            station[field] = req.body[field];
        } else {
            if (
                typeof req.body[field] !== "string" ||
                !req.body[field].trim()
            ) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid value for ${field}`
                });
            }

            station[field] = req.body[field].trim();
        }
    }

    if (
        station.latitude < -90 ||
        station.latitude > 90 ||
        station.longitude < -180 ||
        station.longitude > 180 ||
        station.power <= 0 ||
        station.pricePerKwh < 0
    ) {
        return res.status(400).json({
            success: false,
            message: "Station coordinates, power, or price are invalid"
        });
    }

    res.json({
        success: true,
        message: "Charging station updated successfully",
        data: station
    });
});

app.delete("/api/stations/:id", (req, res) => {
    const index = stations.findIndex(
        item => item.id === Number(req.params.id)
    );

    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: "Charging station not found"
        });
    }

    stations.splice(index, 1);

    res.json({
        success: true,
        message: "Charging station deleted successfully"
    });
});

app.listen(PORT, () => {
    console.log(`VoltWay API running at http://localhost:${PORT}`);
});