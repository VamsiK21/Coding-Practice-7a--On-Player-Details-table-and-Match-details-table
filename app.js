const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayersDbObjectToResponseObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjectToResponseObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

//API for list of all the players in the player table
app.get("/players/", async (request, response) => {
  const getAllPlayersQuery = `
    SELECT
        *
    FROM
        player_details
    ORDER BY
        player_id;

    `;

  const playersArray = await db.all(getAllPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayersDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API for Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;

  const getPlayerQuery = `
    SELECT
        *
    FROM
        player_details
    WHERE
        player_id = ${playerId};
    `;

  const player = await db.get(getPlayerQuery);
  response.send(convertPlayersDbObjectToResponseObject(player));
});

//API for Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;

  const { playerName } = playerDetails;

  const updatePlayerQuery = `
  
    UPDATE
       player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
  `;

  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API for Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;

  const getMatchQuery = `
    SELECT
        *
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `;

  const match = await db.get(getMatchQuery);
  response.send(convertMatchDbObjectToResponseObject(match));
});

//API for Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;

  const getAllMatchesOfAPlayerQuery = `
    SELECT
        match_id, match, year
    FROM match_details
        NATURAL JOIN player_match_score
    WHERE
        player_id = ${playerId};
    `;

  const allMatches = await db.all(getAllMatchesOfAPlayerQuery);
  response.send(
    allMatches.map((eachMatch) =>
      convertMatchDbObjectToResponseObject(eachMatch)
    )
  );
});

//API for Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;

  const getAllPlayersQuery = `
    SELECT
        player_id, player_name
    FROM player_details
        NATURAL JOIN player_match_score
    WHERE
        match_id = ${matchId};
    `;

  const allPlayers = await db.all(getAllPlayersQuery);
  response.send(
    allPlayers.map((eachPlayer) =>
      convertPlayersDbObjectToResponseObject(eachPlayer)
    )
  );
});

//API for Returns the statistics of the total score, fours, sixes of a specific player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const playerId = request.params;

  const getStatsOfAPlayer = `
    SELECT 
        player_details.player_id AS playerId,
        player_details.player_name AS playerName,
        SUM(player_match_score.score) AS totalScore,
        SUM(player_match_score.fours) AS totalFours,
        SUM(player_match_score.sixes) AS totalSixes
    FROM player_details
        INNER JOIN player_match_score ON 
        player_details.player_id = player_match_score.player_id
    WHERE
        player_details.player_id = ${playerId};
     `;

  const stats = await db.get(getStatsOfAPlayer);
  console.log(stats);
  response.send({
    playerId: stats["playerId"],
    playerName: stats["playerName"],
    totalScore: stats["totalScore"],
    totalFours: stats["totalFours"],
    totalSixes: stats["totalSixes"],
  });
});
