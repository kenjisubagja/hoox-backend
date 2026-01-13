const express = require("express");
const app = express();
app.use(express.json());

// DATA SEMENTARA (RAM)
let servers = {};
let revenueToday = 0;

// ROBLOX → heartbeat
app.post("/heartbeat", (req, res) => {
	const { jobId, players, placeId } = req.body;

	if (!jobId) return res.status(400).send("Invalid");

	servers[jobId] = {
		players,
		placeId,
		lastSeen: Date.now()
	};

	res.json({ ok: true });
});

// ROBLOX → revenue (opsional)
app.post("/revenue", (req, res) => {
	const { amount } = req.body;
	revenueToday += amount || 0;
	res.json({ ok: true });
});

// ANDROID → ambil stats
app.get("/stats", (req, res) => {
	const now = Date.now();

	// hapus server mati (>60 detik)
	for (const id in servers) {
		if (now - servers[id].lastSeen > 60000) {
			delete servers[id];
		}
	}

	let totalPlayers = Object.values(servers)
		.reduce((a, b) => a + (b.players || 0), 0);

	res.json({
		servers: Object.keys(servers).length,
		players: totalPlayers,
		revenueToday
	});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Backend running on", PORT);
});
