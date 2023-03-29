const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const express = require("express");
const path = require("path");
const app = express();
app.use(express.json());
const dbpath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`dbError:${e.message}`);
    process.exit(1);
  }
};

initializeAndStartServer();

const StateConvertObject = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const DistrictObject = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};

//getstates

const getallstates = app.get("/states/", async (request, response) => {
  const states = `SELECT * FROM state;`;
  const dbResponse = await db.all(states);
  let camelCase = [];
  for (let each of dbResponse) {
    let h = StateConvertObject(each);
    camelCase.push(h);
  }
  response.send(camelCase);
});

//getspecificstate

const getspecificstate = app.get(
  "/states/:stateId/",
  async (request, response) => {
    const { stateId } = request.params;
    const state = `SELECT * FROM state WHERE state_id=${stateId};`;
    const dbResponse = await db.get(state);
    response.send(StateConvertObject(dbResponse));
  }
);

//add district

const adddistrict = app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const addDistrict = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths) VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const dbResponse = await db.run(addDistrict);
  response.send("District Successfully Added");
});
//specific district
const specificdistrict = app.get(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const dis = `SELECT * FROM district WHERE district_id=${districtId};`;
    const dbResponse = await db.get(dis);
    response.send(DistrictObject(dbResponse));
  }
);

//delete district

const deletedistrict = app.delete(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const deletedis = `DELETE FROM district WHERE district_id=${districtId};`;
    const dbResponse = await db.run(deletedis);
    response.send("District Removed");
  }
);

//update district

const updatedistrict = app.put(
  "/districts/:districtId/",
  async (request, response) => {
    const { districtId } = request.params;
    const districtDetails = request.body;
    const {
      districtName,
      stateId,
      cases,
      cured,
      active,
      deaths,
    } = districtDetails;
    const updatedis = `UPDATE district SET district_name='${districtName}',state_id=${stateId},cases=${cases},cured=${cured},active=${active},deaths=${deaths} WHERE district_id=${districtId};`;
    const dbResponse = await db.run(updatedis);
    response.send("District Details Updated");
  }
);

//specific state total cases

const totalcases = app.get(
  "/states/:stateId/stats/",
  async (request, response) => {
    const { stateId } = request.params;
    const details = `SELECT SUM(cases)AS totalCases,SUM(cured)AS totalCured,SUM(active)AS totalActive,SUM(deaths)AS totalDeaths FROM district WHERE state_id=${stateId};`;
    const dbResponse = await db.get(details);
    response.send(dbResponse);
  }
);

//specific district state details

const districtstatedetails = app.get(
  "/districts/:districtId/details/",
  async (request, response) => {
    const { districtId } = request.params;
    const disdetails = `SELECT * FROM state INNER JOIN district ON state.state_id=district.state_id WHERE district_id=${districtId};`;
    const dbResponse = await db.get(disdetails);
    response.send({ stateName: dbResponse.state_name });
  }
);

const stateDistrictMaintainence = {
  allstates: getallstates,
  specificstate: getspecificstate,
  addistrict: adddistrict,
  specificdistrict: specificdistrict,
  updatedistrict: updatedistrict,
  deletedistrict: deletedistrict,
  totalcases: totalcases,
  districtstatedetails: districtstatedetails,
  stateconvertobj: StateConvertObject,
  districtobj: DistrictObject,
};

module.exports = updatedistrict;
