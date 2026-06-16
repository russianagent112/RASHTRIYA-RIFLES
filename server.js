const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory leader board
let highScores = [
    { name: "RR_Commander", score: 1000 }
];

// API to get high scores
app.get('/api/scores', (req, res) => {
    res.json(highScores);
});

// API to post a new score
app.post('/api/scores', (req, res) => {
    const { name, score } = req.body;
    if (name && typeof score === 'number') {
        highScores.push({ name, score });
        highScores.sort((a, b) => b.score - a.score);
        highScores = highScores.slice(0, 5); // Keep top 5
        res.json({ success: true, highScores });
    } else {
        res.status(400).json({ error: "Invalid data" });
    }
});

app.listen(PORT, () => {
    console.log(`Server running smoothly on port ${PORT}`);
});