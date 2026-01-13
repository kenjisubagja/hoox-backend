const express = require("express");
const app = express();

app.use(express.json());


let servers = {};         
let revenueToday = 0;   
let donations = [];       

app.get("/", (req, res) => {
	res.send("Hoox Backend is running 🚀");
});

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


app.get("/stats", (req, res) => {
	const now = Date.now();

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


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Hoox Backend running on port", PORT);
});
