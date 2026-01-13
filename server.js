const express = require("express");
const app = express();

app.use(express.json());

/*
  DATA DISIMPAN DI RAM
  (cukup untuk monitoring, gratis, tanpa database)
*/
let servers = {};          // jobId -> { players, placeId, lastSeen }
let revenueToday = 0;      // total Robux hari ini
let donations = [];        // list donasi terakhir

// ======================================================
// ROOT (OPTIONAL, BIAR TIDAK "Cannot GET /")
// ======================================================
app.get("/", (req, res) => {
	res.send("Hoox Backend is running 🚀");
});

// ======================================================
// ROBLOX → HEARTBEAT (SERVER + PLAYER)
// ======================================================
app.post("/heartbeat", (req, res) => {
	const { jobId, placeId, players } = req.body;

	if (!jobId) {
		return res.status(400).json({ ok: false, error: "Invalid jobId" });
	}

	servers[jobId] = {
		placeId: placeId || 0,
		players: players || 0,
		lastSeen: Date.now()
	};

	res.json({ ok: true });
});

// ======================================================
// ROBLOX → DONATION / ESTIMASI ROBUX
// ======================================================
app.post("/donation", (req, res) => {
	const { playerId, productId, robux, time } = req.body;

	if (!robux || robux <= 0) {
		return res.json({ ok: false });
	}

	revenueToday += robux;

	donations.push({
		playerId,
		productId,
		robux,
		time: time || Date.now()
	});

	// simpan maksimal 50 donasi terakhir
	if (donations.length > 50) {
		donations.shift();
	}

	res.json({ ok: true });
});

// ======================================================
// ANDROID → AMBIL STATISTIK
// ======================================================
app.get("/stats", (req, res) => {
	const now = Date.now();

	// hapus server yang mati (>60 detik tidak heartbeat)
	for (const jobId in servers) {
		if (now - servers[jobId].lastSeen > 60000) {
			delete servers[jobId];
		}
	}

	let totalPlayers = Object.values(servers)
		.reduce((sum, s) => sum + (s.players || 0), 0);

	res.json({
		servers: Object.keys(servers).length,
		players: totalPlayers,
		revenueToday,
		lastDonations: donations
	});
});

// ======================================================
// START SERVER
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Hoox Backend running on port", PORT);
});
