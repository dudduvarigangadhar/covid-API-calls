const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "covid19India.db");
let db = null;
const initailzeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB Error: ${e.message}");
    process.exit(1);
  }
};

initailzeDBAndServer();

const dbObjectToResponseObject = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};
app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state
    ORDER BY state_id`;
  const statesArray = await db.all(getStatesQuery);
  response.send(statesArray.map((state) => dbObjectToResponseObject(state)));
});

const stateObjectToResponseObject = (state) => {
  return {
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  };
};
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIdQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const stateById = await db.get(getStateByIdQuery);
  response.send(stateObjectToResponseObject(stateById));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  //   const districtDetails = request.body;
  //   console.log(districtDetails);
  const addDistrict = `
      INSERT INTO district
      (district_name,state_id,cases,cured,active,deaths)
      VALUES (
          '${districtName}',
          '${stateId}',
          '${cases}',
          '${cured}',
          '${active}',
          '${deaths}');
      `;
  const dbResponse = await db.run(addDistrict);
  const districtId = dbResponse.lastID;
  response.send("District Successfully Added");
});
const districtObjectToResponseObject = (state) => {
  return {
    districtName: state.district_name,
    stateId: state.state_id,
    cases: state.cases,
    cured: state.cured,
    active: state.active,
    deaths: state.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictById = `
    SELECT * FROM district 
    WHERE district_id = ${districtId};
    `;
  const district = await db.get(getDistrictById);
  response.send(districtObjectToResponseObject(district));
});

app.delete("/districts/:districtId/", (request, response) => {
  const { districtId } = request.params;
  const DeleteDistrictQuery = `
    DELETE FROM district 
    WHERE district_id = ${districtId};
    `;
  db.run(DeleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictByIdQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
    stateId = '${stateId}',
    cases = '${cases}',
    cured = '${cured}'
    active = '${active}',
    deaths = '${deaths}'
    WHERE district_id = ${districtID};
    `;
  await db.run(updateDistrictByIdQuery);
  response.send("District Details Updated");
});
const statsArrayTOResponseObject = (state) => {
  return {
    totalCases: state["SUM(cases)"],
    totalCured: state["SUM(cured"],
    totalActive: state["SUM(active)"],
    totalDeaths: state["SUM(deaths)"],
  };
};
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
    SELECT 
    SUM(cases),
    SUM(cured),
    SUM(active),
    SUM(deaths)
    FROM district 
    WHERE state_id = ${stateId};
    `;
  const statsArray = await db.get(getStatsQuery);
  response.send(statsArrayTOResponseObject(statsArray));
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  console.log(districtId);
  const getDistrictIdQuery = `
    SELECT state_id FROM district
    WHERE district_id = ${districtId};
    `;
  const districtResponse = await db.get(getDistrictIdQuery);

  const getStateNameQuery = `
    SELECT state_name as stateName FROM state
    WHERE state_id = ${districtResponse.state_id}
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
