var map = L.map("map", {
	zoomControl: false,
	attributionControl: false,
	maxBounds: philippinesBounds,
	maxBoundsViscosity: 1.0,
	minZoom: 5.48,
}).setView([12.8797, 121.774], 5.48);

var philippinesBounds = [
	[3.0, 114.0],
	[23.0, 129.0],
];

const BASE = "https://data.bilangpilipino.com/summary"

let isNational = true;
let isProvincial = false;

// this will remove spaces, - , that will used to fetch places
function removeSpacesSpecialChar(text) {
	return text?.trim()?.replace(/[\s-]+/g, '_').toLowerCase()
}
function formatRegionName(regionFullName) {
	const regionCode = regionFullName.split(' - ')[0]; // Get "Region IV-A"
	return regionCode.trim().replace(/[\s-]+/g, '_').toLowerCase();
}

async function queryData({ region, province, city: fCity, national }) {
	let fProvince = province && removeSpacesSpecialChar(province);
	let fRegion = region
	// console.log(region, 'region')
	// console.log(fProvince, 'fProvince-----------')
	// console.log(province, 'province')
	// console.log(fCity, 'city')

	// if (fRegion?.includes('region_iv-a')) {
	// 	fRegion = 'region_iv_a'
	// } else if(fRegion?.includes('region_iv-b')){
	// 	fRegion = 'region_iv_a'
	// }


	try {
		if (fRegion) {
			if (fRegion === "region_xiii_caraga") {
				fRegion = "region_xiii";
			} else if (fRegion === "region_xii_soccsksargen") {
				fRegion = "region_xii";
			} else if (fRegion === "region_iv-b_mimaropa_region") {
				fRegion = "region_iv_b";
			}
			else if (fRegion === "region_iv-a_calabarzon") {
				fRegion = "region_iv_a";
			}
			else if (fRegion === "region_xiii_caraga") {
				fRegion = "region_xiii";
			}
			else if (fRegion === "region_xii_soccsksargen") {
				fRegion = "region_xii";
			} else if (fRegion === "CAR - Cordillera Administrative Region") {
				fRegion = "cordillera_administrative_region";

			}

		}

		let response;
		if (national) {
			// for national
			response = await fetch(`${BASE}/${national}.json`);
			response = await response.json();
		}
		else if (fCity) {
			// console.log('fRegion: ', fRegion)
			// console.log('fCity: ', fCity)
			// console.log('fProvince: ', fProvince)
			// console.log("eto");
			response = await fetch(`${BASE}/${fRegion}/${fProvince.toLowerCase()}/${fCity.toLowerCase()}.json`);
			response = await response.json();
		}
		else if (fRegion && fProvince) {

			// console.log(allLocations);

			let provinceCode = allLocations.regions
				.find(r => {
					if (r.code === fRegion) {
						return r
					}
				})?.places
				.find(p => {
					if (p.name.toLowerCase().replace(/ /g, "") === province) {
						return p
					}
				})?.code

			if (fRegion === 'national_capital_region') {
				const group = data => {
					const voteMap = new Map();

					for (const { CANDIDATE_NAME, TOTAL_VOTES } of data) {
						if (voteMap.has(CANDIDATE_NAME)) {
							voteMap.set(CANDIDATE_NAME, voteMap.get(CANDIDATE_NAME) + TOTAL_VOTES);
						} else {
							voteMap.set(CANDIDATE_NAME, TOTAL_VOTES);
						}
					}

					// Convert Map back to an array of objects
					const summedVotes = Array.from(voteMap.entries()).map(([name, votes]) => ({
						CANDIDATE_NAME: name,
						TOTAL_VOTES: votes
					}));

					return summedVotes
				}

				const ncrResults = allLocations.regions.find(item => item.code === fRegion)
					.places.map(async item => {
						const res = await fetch(`${BASE}/${fRegion}/${item.code}.json`)
						const data = await res.json()

						return data
					})

				const data = await Promise.all(ncrResults)
				const obj = {
					timestamp: data[0].timestamp,
					region: data[0].region,
					results: {
						'SENATOR OF PHILIPPINES': group(data.map(item => item.results['SENATOR OF PHILIPPINES']).flat()),
						'PARTY LIST OF PHILIPPINES': group(data.map(item => item.results['PARTY LIST OF PHILIPPINES']).flat())
					}
				}

				return obj
			}

			response = await fetch(`${BASE}/${fRegion}/${province}.json`);
			// response = await fetch(`${BASE}/${fRegion}/${provinceCode}.json`);
			response = await response.json();
		}
		return response;
	} catch (error) {
		// console.log(error, 'error on fetching.................')
	}
}

// function that search string inside another string in any ways.
function isPartOfString(substring, fullString) {
	const normalize = str => str.replace(/[^a-z]/gi, '').toLowerCase();

	return normalize(fullString).includes(normalize(substring));
}

//   check every arr to match especific key
function returnKeyOfArr(key, arr) {
	return Object.keys(arr)?.find((item) => {
		if (item.toLowerCase().trim().includes(key.toLowerCase().trim())) {
			return item
		}
	})

}
// provinces data is a data containing all the actual data for the onload
// responsible for onload coloring of map
const provincesData = [];
let allLocations = [];

function normalizeCityName(name) {
	return name
		.toLowerCase()
		.replace(/city|of/g, '')      // remove 'city' and 'of'
		.replace(/[^a-z]/g, '');      // remove all non-letter characters
}

async function queryMappedData(target = "province") {
	if (target === "province") {
		try {
			allLocations = await fetch(`./assets/json/regions_philippines.json`);
			allLocations = await allLocations.json();

			let allRequest = allLocations?.regions?.map(async (item) => {
				let regionName = formatRegionName(item?.name);

				const fRes = item?.places?.map(async (item2) => {
					let name = item2?.name?.includes('-') ? item2?.name?.toLowerCase()?.replace("-", '')?.split(" ")?.join("_") : item2?.name?.toLowerCase()?.split(" ").join("_")

					name = name?.replace("__", '_');
					if (regionName === "car") {
						regionName = "cordillera_administrative_region"
					}
					else if (regionName === "ncr") {
						regionName = "national_capital_region"
					}

					// for name
					if (name === "north_cotabato") {
						name = "cotabato"
					}
					try {
						const result = await fetch(`${BASE}/${regionName}/${name}.json`);
						const res = await result.json();
						provincesData.push({
							...res,

						})
						return result;
					} catch (error) {
						// console.log(error,'error')
					}
				})

				const g = await Promise.all(fRes);
				return g;
			})

			const result = await Promise.all(allRequest);
		} catch (error) {
			console.log(error, 'erorrr');

		}
	}
}

function toSnakeCase(text) {
	return text
		.replace(/-/g, '_')                         // Replace hyphens with underscores
		.replace(/([a-z])([A-Z])/g, '$1_$2')        // Insert _ between lowercase and uppercase
		.toLowerCase();
}

function drawMap() {
	Promise.all([
		addLayer("./assets/json/gadm41_PHL_0.json", "COUNTRY", {
			fillColor: "none",
			weight: 2,
			opacity: 1,
			color: "#000",
			fillOpacity: 0,
		}),

		addLayer(
			"./assets/json/gadm41_PHL_1.json",
			"NAME_1",
			null,
			function (feature, layer) {
				const normalizedName = (feature.properties.NAME_1 || "unknown")
					.toLowerCase()
					.replace(/\s+/g, "");
				const region =
					provinceToRegion[normalizedName] ||
					"Bangsamoro Autonomous Region in Muslim Mindanao";

				provincesLayer.eachLayer(async (provLayer) => {
					const provNormalizedName = (
						provLayer.feature.properties.NAME_1 || "unknown"
					)
						.toLowerCase()
						.replace(/\s+/g, "");
					let topCandidate = null;
					let maxProvinceVotes = -1;
					if (
						provLayer.feature.properties.NAME_1 === feature.properties.NAME_1 &&
						allCitiesData
					) {
						const provinceCities = allCitiesData.features.filter(
							(cityFeature) =>
								(cityFeature.properties.NAME_1 || "")
									.toLowerCase()
									.replace(/\s+/g, "") === provNormalizedName
						);

						// let regionFormatted = formatRegion(region).toLowerCase();

						// if(regionFormatted !== "car"){
						// 	regionFormatted = regionFormatted.trim().split(" ").join("_");``
						// }else if(regionFormatted === "car"){
						// 	regionFormatted = "cordillera_administrative_region"
						// }
						// displaySenatorialData(results?.senatorial)

						try {
							let payload = formatRegionPayload(region)
							const { results, timestamp } = await queryData({
								region: payload,
								province: provLayer.feature.properties.NAME_1.toLowerCase()
							});
							// console.log(provLayer.feature.properties.NAME_1.toLowerCase(),'boooooooooooooo')


							// activateTab('[data-type="localrace"]');

							generateLocalRaceHTML(results)

							// const pGov = returnKeyOfArr('PROVINCIAL GOVERNOR', results);
							// const pVicGov = returnKeyOfArr('PROVINCIAL VICE-GOVERNOR', results);
							// const member = returnKeyOfArr('MEMBER, HOUSE OF REPRESENTATIVES OF', results);
							// buildLocalPayload(timestamp,results[pGov],results[pVicGov], results[member])	

							displaySenatorialData(results['SENATOR OF PHILIPPINES']);
							displayPartylistData(results['PARTY LIST OF PHILIPPINES']);
						} catch (error) {
							console.log(error, 'error fetching data')
						}

						const candidateVotes = {};
						provinceCities.forEach((cityFeature) => {


							const cityName = (cityFeature.properties.NAME_2 || "unknown")
								.toLowerCase()
								.replace(/\s+/g, "");

							const cityCandidates = citySenatoriablesData.filter(
								(c) =>
									c.city.toLowerCase().replace(/\s+/g, "") === cityName &&
									(cityFeature.properties.NAME_1 || "")
										.toLowerCase()
										.replace(/\s+/g, "") === provNormalizedName
							);

							cityCandidates.forEach((candidate) => {
								candidateVotes[candidate.candidateName] =
									(candidateVotes[candidate.candidateName] || 0) +
									candidate.votes;
							});
						});

						for (const [name, totalVotes] of Object.entries(candidateVotes)) {
							if (totalVotes > maxProvinceVotes) {
								maxProvinceVotes = totalVotes;
								const candidate = citySenatoriablesData.find(
									(c) => c.candidateName === name
								);
								if (candidate) {
									topCandidate = candidate;
								}
							}
						}

						// Also update the tooltip for when provinces are re-colored
						const provinceName = provLayer.feature.properties.NAME_1;
						const candidateName = topCandidate
							? topCandidate.candidateName
							: "No Candidate";

						provLayer.bindTooltip(
							`${provinceName}<br>Top Candidate: ${candidateName}<br>Votes: ${maxProvinceVotes.toLocaleString()}`,
							{
								permanent: false,
								direction: "center",
								className: "candidate-tooltip",
							}
						);
					}

					// This is where provinces gets their color
					provLayer.setStyle({
						fillColor:
							provLayer.feature.properties.NAME_1 === feature.properties.NAME_1 &&
								topCandidate
								? topCandidate.candidateColor
								: "#fff",
						weight: 1,
						opacity: 0.8,
						color: "#000",
						fillOpacity: 0.9,
					});
				});
				clearHighlightedLayers();
				updateInfoBox(feature.properties.NAME_1, `under ${region}`);
				highlightLayer(layer);
				map.fitBounds(layer.getBounds());
				// issue relies here
				showCitiesForProvince(feature);
				updateElectionResults("province", feature.properties.NAME_1);
				console.log("clicked city");
				activateTab('[data-type="senators"]');
			}
		),

		addLayer(
			"./assets/json/gadm41_PHL_2.json",
			"NAME_2",
			null,
			function (feature, layer) {
				const cityName = feature.properties.NAME_2 || "Unknown City";
				const provinceName = feature.properties.NAME_1 || "Unknown Province";
				const normalizedCity = cityName.toLowerCase().replace(/\s+/g, "");
				let topCandidate = null;
				let maxVotes = 0;


				const cityCandidates = citySenatoriablesData.filter(
					(c) =>
						c.city.toLowerCase().replace(/\s+/g, "") === normalizedCity &&
						(feature.properties.NAME_1 || "")
							.toLowerCase()
							.replace(/\s+/g, "") ===
						provinceName.toLowerCase().replace(/\s+/g, "")
				);

				cityCandidates.forEach((candidate) => {
					if (candidate.votes > maxVotes) {
						maxVotes = candidate.votes;
						topCandidate = candidate;
					}
				});

				const candidateName = topCandidate
					? topCandidate.candidateName
					: "No Candidate";
				// this is where the cityname, top candidate, and votes are displayed in the tooltip
				layer.bindTooltip(
					`${cityName}<br>Top Candidate: ${candidateName} <br>Votes: ${maxVotes.toLocaleString()}`,
					{
						permanent: false,
						direction: "center",
						className: "candidate-tooltip",
					}
				);

				layer.on({
					mouseover: function (e) {
						layer.setStyle({
							weight: 3,
							color: "#00BFFF",
							opacity: 1,
						});
						layer.openTooltip(layer.getBounds().getCenter());
					},
					mouseout: function (e) {
						layer.setStyle({
							weight: 1,
							color: "#000",
							opacity: 0.8,
						});
						layer.closeTooltip();
					},
					click: function (e) {
						clearHighlightedLayers();
						highlightLayer(layer);
						updateInfoBox(cityName, `under ${provinceName}`);
						updateElectionResults("city", cityName);
						map.fitBounds(layer.getBounds(), {
							padding: [50, 50],
						});
					},
				});
			}
		),
	])
		.then((layers) => {
			countryLayer = layers[0];
			provincesLayer = layers[1];
			citiesLayer = layers[2];

			if (!provincesLayer) console.error("Provinces layer failed to load");
			if (!citiesLayer) console.error("Cities layer failed to load");

			countryLayer.addTo(map);
			provincesLayer.addTo(map);
			map.fitBounds(provincesLayer.getBounds());
			// updateElectionResults("national");
		})
		.catch((error) => console.error("Error loading layers:", error));
}

function buildLocalPayload(timestamp, governor, vice, house, mayor, viceMayor, councilor) {
	const payload = {
		timestamp,
		results: {
			governor: governor?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES

				}
			}),
			vice_governor: vice?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES
				}
			}),
			house_of_representatives: house?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES
				}
			}),
			mayor: mayor?.length && house?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES
				}
			}),
			vice_mayor: viceMayor?.length && house?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES
				}
			}),
			councilor: councilor?.length && councilor?.map((item) => {
				return {
					CANDIDATE_NAME: item.CANDIDATE_NAME,
					TOTAL_VOTES: item?.TOTAL_VOTES
				}
			}),
		}
	}

	generateLocalRaceHTML(payload)
}

// tab setter
function activateTab(tabSelector) {
	const tabTrigger = document.querySelector(tabSelector);
	if (tabTrigger) {
		const tab = new bootstrap.Tab(tabTrigger);
		tab.show(); // Activates the tab and triggers events
	}
}

const provinceToRegionOriginal = {
	"Ilocos Norte": "Region I",
	"Ilocos Sur": "Region I",
	"La Union": "Region I",
	Pangasinan: "Region I",
	Abra: "CAR",
	Apayao: "CAR",
	Benguet: "CAR",
	Ifugao: "CAR",
	Kalinga: "CAR",
	"Mountain Province": "CAR",
	Batanes: "Region II ",
	Cagayan: "Region II ",
	Isabela: "Region II ",
	"Nueva Vizcaya": "Region II ",
	Quirino: "Region II ",
	Aurora: "Region III",
	Bataan: "Region III",
	Bulacan: "Region III",
	"Nueva Ecija": "Region III",
	Pampanga: "Region III",
	Tarlac: "Region III",
	Zambales: "Region III",
	"Metropolitan Manila": "National Capital Region",
	Batangas: "Region IV-A CALABARZON",
	Cavite: "Region IV-A CALABARZON",
	Laguna: "Region IV-A CALABARZON",
	Quezon: "Region IV-A CALABARZON",
	Rizal: "Region IV-A CALABARZON",
	Marinduque: "Region IV-B MIMAROPA Region",
	"Occidental Mindoro": "Region IV-B MIMAROPA Region",
	"Oriental Mindoro": "Region IV-B MIMAROPA Region",
	Palawan: "Region IV-B MIMAROPA Region",
	Romblon: "Region IV-B MIMAROPA Region",
	Albay: "Region V",
	"Camarines Norte": "Region V",
	"Camarines Sur": "Region V",
	Catanduanes: "Region V",
	Masbate: "Region V",
	Sorsogon: "Region V",
	Aklan: "Region VI",
	Antique: "Region VI",
	Capiz: "Region VI",
	Guimaras: "Region VI",
	Iloilo: "Region VI",
	NegrosOccidental: "NIR",
	NegrosOriental: "NIR",
	Bohol: "Region VII",
	Cebu: "Region VII",
	Siquijor: "Region VII",
	Biliran: "Region VIII",
	"Eastern Samar": "Region VIII",
	Leyte: "Region VIII",
	"Northern Samar": "Region VIII",
	Samar: "Region VIII",
	"Southern Leyte": "Region VIII",
	"Zamboanga del Norte": "Region IX",
	"Zamboanga del Sur": "Region IX",
	"Zamboanga Sibugay": "Region IX",
	Bukidnon: "Region X",
	Camiguin: "Region X",
	"Lanao del Norte": "Region X",
	"Misamis Occidental": "Region X",
	"Misamis Oriental": "Region X",
	"Agusan del Norte": "Region XIII Caraga",
	"Agusan del Sur": "Region XIII Caraga",
	"Dinagat Islands": "Region XIII Caraga",
	"Surigao del Norte": "Region XIII Caraga",
	"Surigao del Sur": "Region XIII Caraga",
	CompostelaValley: "Region XI",
	"Davao de Oro": "Region XI",
	"Davao del Norte": "Region XI",
	"Davao del Sur": "Region XI",
	"Davao Occidental": "Region XI",
	"Davao Oriental": "Region XI",
	NorthCotabato: "Region XII SOCCSKSARGEN",
	Cotabato: "Region XII SOCCSKSARGEN",
	Sarangani: "Region XII SOCCSKSARGEN",
	"South Cotabato": "Region XII SOCCSKSARGEN",
	"Sultan Kudarat": "Region XII SOCCSKSARGEN",
	Basilan: "BARMM",
	"Lanao del Sur": "BARMM",
	Maguindanao: "BARMM",
	Sulu: "BARMM",
	"Tawi-Tawi": "BARMM",
};

// format the region value to match file structure 
function toRoman(num) {
	const romanMap = [
		[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
		[100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
		[10, "X"], [9, "IX"], [5, "V"], [4, "IV"],
		[1, "I"]
	];

	let result = '';
	for (let [value, numeral] of romanMap) {
		while (num >= value) {
			result += numeral;
			num -= value;
		}
	}
	return result;
}

function formatRegion(text) {
	const match = text.match(/Region\s+(\d+)/i);
	if (!match) return text; // return original if no match
	const number = parseInt(match[1]);
	const roman = toRoman(number);
	return `Region ${roman}`;
}

function formatRegionPayload(region) {
	let formatted = "";
	let regionFormatted = formatRegion(region).toLowerCase();

	if (regionFormatted === "car") {
		formatted = "cordillera_administrative_region"
	} else if (regionFormatted === "region iv-b mimaropa region") {
		formatted = "region_iv_b"
	}
	else {
		formatted = regionFormatted.trim().split(" ").join("_");
	}
	return formatted;
}

function highlightRegionOnMap(regionName) {
	if (!provincesLayer) return;

	clearHighlightedLayers();
	const regionBounds = L.latLngBounds();
	let hasProvinces = false;

	// Remove cities layer if it exists
	if (citiesLayer) {
		map.removeLayer(citiesLayer);
		citiesLayer = null;
	}

	provincesLayer.eachLayer((layer) => {
		const layerProvince = layer.feature?.properties.NAME_1;
		if (layerProvince) {
			const normalizedName = layerProvince.toLowerCase().replace(/\s+/g, "");
			const region = provinceToRegion[normalizedName];

			if (region === regionName) {
				highlightLayer(layer);
				regionBounds.extend(layer.getBounds());
				hasProvinces = true;
			}
		}
	});

	if (hasProvinces) {
		map.fitBounds(regionBounds, { padding: [50, 50] });
		updateInfoBox(
			regionName,
			regionName === "National Capital Region" ? "NCR" : regionName
		);
		currentRegion = regionName;
	}
}

async function highlightProvinceOnMap(provinceName, cityName, regionName = null) {
	// console.log(cityName, 'citynaeemeeeeeeeeeeeee')
	if (!cityName) {

		const { results, timestamp } = await queryData({
			// payload, provLayer.feature.properties.NAME_1
			region: regionHover,
			province: provinceName
		});
		// console.log(results);
		activateTab('[data-type="localrace"]');

		const pGov = returnKeyOfArr('PROVINCIAL GOVERNOR', results);
		const pVicGov = returnKeyOfArr('PROVINCIAL VICE-GOVERNOR', results);
		const member = returnKeyOfArr('MEMBER, HOUSE OF REPRESENTATIVES OF', results);

		buildLocalPayload(timestap, results[pGov], results[pVicGov], results[member])

	}

	if (regionName !== null) {
		updateInfoBox(provinceName, `under ${regionName}`);
	} else {
		updateInfoBox(provinceName, `under ${regionHover}`);
	}
	if (!provincesLayer) return;

	clearHighlightedLayers();
	let found = false;
	// console.log(allProvincesData);
	provincesLayer.eachLayer((layer) => {
		const layerProvince = layer.feature?.properties.NAME_1;
		if (
			layerProvince &&
			layerProvince.toLowerCase() === provinceName.replace(/[\s-]+/g, '').toLowerCase()
		) {
			highlightLayer(layer);
			found = true;

			// Find the corresponding feature in the original data
			const feature = allProvincesData.features.find(
				(f) => f.properties.NAME_1.toLowerCase() === provinceName.replace(/[\s-]+/g, '').toLowerCase()
			);

			// console.log(feature, 'featurefeature')

			if (feature) {
				// Show cities for this provincea
				// alert(1)
				showCitiesForProvince(feature);
				map.fitBounds(layer.getBounds());
			}
			return;
		}
	});

	if (!found) {
		console.warn(`Province not found: ${provinceName}`);
	}
}

async function clickedByHeader({ region, province, city }) {
	// console.log(region, 'regionregion')
	// console.log(province, 'provinceprovince')
	// console.log(city, 'city')


	if (city) {
		const { results, timestamp } = await queryData({
			region: region.trim().replace(/[\s-]+/g, '_').toLowerCase(),
			province: province.trim().replace(/[\s-]+/g, '_').toLowerCase(),
			city: city.trim().replace(/[\s-]+/g, '_').toLowerCase()
		});


		// const pGov = returnKeyOfArr('PROVINCIAL GOVERNOR', results);
		// const pVicGov = returnKeyOfArr('PROVINCIAL VICE-GOVERNOR', results);
		// const member = returnKeyOfArr('MEMBER, HOUSE OF REPRESENTATIVES OF', results);
		// const mayor =  returnKeyOfArr('MAYOR OF', results);
		// const vMayor =  returnKeyOfArr('VICE-MAYOR OF', results);
		displaySenatorialData(results['SENATOR OF PHILIPPINES']);


		activateTab('[data-type="localrace"]');
		displayPartylistData(results['PARTY LIST OF PHILIPPINES']);

		// buildLocalPayload(results)
		generateLocalRaceHTML(results);
		console.log(city);
		updateInfoBox(city, `under ${province}`);

		// buildLocalPayload(timestamp,results[pGov],results[pVicGov],results[member], results[mayor],results[vMayor], results[member])


	} else if (region) {
		alert("region`")

		const { results } = await queryData({
			region: regionF
		});


		buildLocalPayload(results)
		activateTab('[data-type="localrace"]');

	}
}


function showCitiesForNCR() {
	if (!allCitiesData) {
		console.error("Cities data not loaded yet");
		return;
	}
	if (citiesLayer) map.removeLayer(citiesLayer);

	const ncrCities = {
		type: "FeatureCollection",
		features: allCitiesData.features.filter(
			feature => (feature.properties.NAME_1 || "").toLowerCase().includes("metropolitanmanila")
		)
	};

	citiesLayer = L.geoJSON(ncrCities, {
		style: function (feature) {
			const cityName = feature.properties.NAME_2 || "unknown";
			const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
			let topCandidate = null;
			let maxVotes = 0;

			const cityCandidates = citySenatoriablesData.filter(c =>
				c.city.toLowerCase().replace(/\s+/g, '') === normalizedCity
			);

			cityCandidates.forEach(candidate => {
				if (candidate.votes > maxVotes) {
					maxVotes = candidate.votes;
					topCandidate = candidate;
				}
			});

			const fillColor = topCandidate ? topCandidate.candidateColor : '#FFFFFF';
			return {
				fillColor: fillColor,
				weight: 1,
				opacity: 0.8,
				color: '#000',
				fillOpacity: 0.5
			};
		},
		onEachFeature: function (feature, layer) {
			const cityName = feature.properties.NAME_2 || "Unknown City";
			const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
			let topCandidate = null;
			let maxVotes = 0;

			const cityCandidates = citySenatoriablesData.filter(c =>
				c.city.toLowerCase().replace(/\s+/g, '') === normalizedCity
			);

			cityCandidates.forEach(candidate => {
				if (candidate.votes > maxVotes) {
					maxVotes = candidate.votes;
					topCandidate = candidate;
				}
			});

			const candidateName = topCandidate ? topCandidate.candidateName : "No Candidate";

			layer.bindTooltip(`${cityName}<br>Top Candidate: ${candidateName}`, {
				permanent: false,
				direction: 'center',
				className: 'candidate-tooltip'
			});

			// layer.on({
			//   mouseover: function(e) {
			//     if (!highlightedLayers.includes(layer)) {
			//       layer.setStyle({
			//         weight: 3,
			//         color: '#00BFFF',
			//         opacity: 1
			//       });
			//     }
			//     layer.openTooltip(layer.getBounds().getCenter());
			//   },
			//   mouseout: function(e) {
			//     if (!highlightedLayers.includes(layer)) {
			//       layer.setStyle({
			//         weight: 1,
			//         color: '#000',
			//         opacity: 0.8
			//       });
			//     }
			//     layer.closeTooltip();
			//   },
			//   click: function(e) {
			//     clearHighlightedLayers();
			//     highlightLayer(layer);
			//     updateInfoBox(cityName, "under National Capital Region");
			//     // updateElectionResults("city", cityName);
			//     // map.fitBounds(layer.getBounds(), {
			//     //   padding: [50, 50]
			//     // });
			//   }
			// });
		}
	}).addTo(map);

	ncrCities.features.forEach(cityFeature => {
		citiesLayer.eachLayer(layer => {
			if (layer.feature === cityFeature) {
				highlightLayer(layer);
			}
		});
	});

	// updateElectionResults("region", "National Capital Region");
}

function highlightCityOnMap(cityName, provinceName, region) {

	clickedByHeader({
		region,
		province: provinceName,
		city: cityName
	})

	// First ensure the province is highlighted and cities are shown
	highlightProvinceOnMap(provinceName, cityName);

	const displayCityName = cityName.toLowerCase() === provinceName.toLowerCase()
		? `${cityName} City`
		: cityName;
	updateInfoBox(displayCityName, `under ${provinceName}`);
	document.getElementById("selected-place").innerText = displayCityName;
	// Then try to find and highlight the city
	const tryHighlightCity = () => {
		if (!citiesLayer) {
			setTimeout(tryHighlightCity, 100);

			return;
		}

		let cityFound = false;
		citiesLayer.eachLayer((layer) => {
			const layerCity = layer.feature?.properties.NAME_2;
			const layerProvince = layer.feature?.properties.NAME_1;

			if (
				layerCity &&
				layerProvince &&
				layerCity.toLowerCase() === cityName.toLowerCase() &&
				layerProvince.toLowerCase() === provinceName.toLowerCase()
			) {
				clearHighlightedLayers();
				highlightLayer(layer);
				map.fitBounds(layer.getBounds());

				// Update info box
				const displayCityName =
					cityName.toLowerCase() === provinceName.toLowerCase()
						? `${cityName} City`
						: cityName;
				// updateInfoBox(displayCityName, `under ${provinceName}`);
				cityFound = true;
				return;
			}
		});

		if (!cityFound) {
			console.warn(`City not found: ${cityName} in ${provinceName}`);
		}
	};

	// Start trying to highlight the city
	tryHighlightCity();
}

// Modified showCitiesForProvince to handle highlighting better
function showCitiesForProvince(provinceFeature) {
	if (!allCitiesData) {
		console.error("Cities data not loaded yet");
		return;
	}

	// Remove existing cities layer if it exists
	if (citiesLayer) {
		map.removeLayer(citiesLayer);
	}

	const provinceName = provinceFeature.properties.NAME_1;
	const normalizedProvince = (provinceName || "unknown")
		.toLowerCase()
		.replace(/\s+/g, "");
	const region =
		provinceToRegion[normalizedProvince] ||
		"Bangsamoro Autonomous Region in Muslim Mindanao";



	var filteredCities = {
		type: "FeatureCollection",
		features: allCitiesData.features.filter(
			(feature) =>
				(feature.properties.NAME_1 || "").toLowerCase().replace(/\s+/g, "") ===
				normalizedProvince
		),
	};

	citiesLayer = L.geoJSON(filteredCities, {
		style: function (feature) {
			// ... existing style code ...
		},
		onEachFeature: function (feature, layer) {
			// ... existing onEachFeature code ...
		},
	}).addTo(map);

	updateInfoBox(provinceName, `under ${region}`);
}
const provinceToRegion = {};
for (let province in provinceToRegionOriginal) {
	const normalizedKey = province.toLowerCase().replace(/\s+/g, "");
	provinceToRegion[normalizedKey] = provinceToRegionOriginal[province];
}

var countryLayer, provincesLayer, citiesLayer;
var allProvincesData, allCitiesData;
var currentRegion = null;

var highlightedLayers = [];
let blinkInterval = null;

let citySenatoriablesData = [];

// async function loadCitySenatoriables() {
//   try {
//     const response = await fetch('<?= base_url("assets/BP2025/data/cities_senatoriables.json") ?>');
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }
//     citySenatoriablesData = await response.json();
//     // console.log('City senatoriables loaded:', citySenatoriablesData.length, 'entries');
//   } catch (error) {
//     // console.error('Error loading cities_senatoriables.json:', error);
//   }
// }

// Call on page load
// responsible for fetching the data of list onload
document.addEventListener("DOMContentLoaded", async () => {
	// await loadCitySenatoriables();
	// updateElectionResults('national');
	// const {results} = await queryData({national:'national'});

	// displaySenatorialData(results?.senatorial)
	// citySenatoriablesData = results?.senatorial;

	// displayPartylistData(results?.partyList)

	try {
		const res = await fetch(`./assets/json/data_ready.json`);
		const READY = await res.json();

		if (!READY.status) {
			drawMap()

			const label = document.querySelector("#timestamp-label")
			label.innerHTML = "We are still waiting for the data to become available. Kindly check back."
			label.style = "font-size: 16px; position: relative; text-align: center; width: 80%; padding: 200px 0; margin: 0 auto;";

			document.querySelector("#senator-list-btn").style = "display: none !important;";
			document.querySelector("#partylist-list-btn").style = "display: none !important;";

			return
		}

		// console.log('READY', READY)
		const data = await queryData({ national: 'national' });
		// console.log('data:', data)
		const { timestamp, percentage, results } = data
		// console.log('----', results)
		await queryMappedData("province");

		drawMap()

		// Update all timestamp displays
		updateTimestampDisplay(timestamp, READY.status);
		updatePercentageDisplay(percentage, READY.status)

		// Display data
		if (results) {
			displaySenatorialData(results.senatorial, READY.status);
			displayPartylistData(results.partyList, READY.status);
		}
	} catch (error) {
		// updateTimestampDisplay('Error loading data');
		// updatePercentageDisplay('0')

	}
});



function highlightLayer(layer) {
	console.log(layer);
	layer.setStyle({
		weight: 3,
		color: "#1E90FF",
		dashArray: null,
		opacity: 1,
		fillOpacity: layer.options.fillOpacity,
	});

	layer.bringToFront();
	layer.redraw();

	let opacity = 1;
	if (!blinkInterval) {
		blinkInterval = setInterval(() => {
			opacity = opacity === 1 ? 0.7 : 1;
			highlightedLayers.forEach((l) => {
				l.setStyle({
					opacity: opacity,
				});
			});
		}, 800);
	}
	highlightedLayers.push(layer);
}

function clearHighlightedLayers() {
	highlightedLayers.forEach((layer) => {
		layer.setStyle({
			weight: 1,
			opacity: 0.8,
			color: "#000",
			dashArray: null,
			fillOpacity: layer.options.fillOpacity,
		});
		layer.redraw();
	});
	highlightedLayers = [];
	if (blinkInterval) {
		clearInterval(blinkInterval);
		blinkInterval = null;
	}
}

function updateInfoBox(name, underText) {
	const infoBox = document.getElementById("info-box");
	infoBox.style.display = "block";
	infoBox.style.zIndex = "1";
	infoBox.innerHTML = `<div class="name">${name}</div><hr><div class="under">${underText}</div>	`;
	document.getElementById("selected-place").innerText = name;
}
function addLayer(geojsonUrl, nameProperty, styleOptions, onClickHandler) {
	return fetch(geojsonUrl)
		.then((response) => response.json())
		.then(async (data) => {
			if (nameProperty === "NAME_1") allProvincesData = data;
			if (nameProperty === "NAME_2") allCitiesData = data;

			var layer = L.geoJSON(data, {
				style: function (feature) {

					if (nameProperty === "NAME_1") {
						// normalize name is province name
						let normalizedName = (feature.properties.NAME_1 || "unknown")
							.toLowerCase()
							.replace(/\s+/g, "");

						if (normalizedName === "metropolitanmanila") {
							normalizedName = "NATIONAL CAPITAL REGION - MANILA".toLowerCase()
						}

						let target = provincesData?.find((item) => {
							if (isPartOfString(normalizedName, item.province)) {
								return item
							}
						});

						let HEX = staticCandidate?.find((item2) => {
							if (item2?.CANDIDATE_NAME.toLowerCase() === target?.results['SENATOR OF PHILIPPINES'][0]?.CANDIDATE_NAME.toLowerCase()) {
								return item2;
							}
						})?.HEX_CODE || '#fff';


						const region =
							provinceToRegion[normalizedName] ||
							"Bangsamoro Autonomous Region in Muslim Mindanao";
						let topCandidate = null;

						if (currentRegion === region) {
							// alert(1)
							for (const [name, data] of Object.entries(candidateData)) {
								const candidateProvince = data.province_city
									.toLowerCase()
									.replace(/\s+/g, "");
								if (
									candidateProvince === normalizedName &&
									(!topCandidate || data.rank < topCandidate.rank)
								) {
									topCandidate = {
										name,
										...data,
									};
								}
							}
						}

						return {
							fillColor: HEX,
							weight: 1,
							opacity: 0.8,
							color: "#000",
							fillOpacity: 0.9,
						};
					} else if (nameProperty === "NAME_2") {


						return {
							fillColor: "#4287f5",
							weight: 1,
							opacity: 0.8,
							color: "#000",
							fillOpacity: 0.5,
						};
					} else {
						return styleOptions || {};
					}
				},
				onEachFeature: function (feature, layer) {
					const normalizedName = (feature.properties.NAME_1 || "unknown")
						.toLowerCase()
						.replace(/\s+/g, "");

					if (onClickHandler) {
						layer.on("click", function (e) {
							onClickHandler(feature, layer, e);

						});
					}
					layer.on({
						mouseover: function (e) {

							let target = provincesData?.find((item) => {
								if (isPartOfString(normalizedName, item.province)) {
									return item
								}
							});
							let topCandi;
							staticCandidate?.find((item2) => {
								if (item2?.CANDIDATE_NAME.toLowerCase() === target?.results['SENATOR OF PHILIPPINES'][0]?.CANDIDATE_NAME.toLowerCase()) {
									topCandi = target?.results['SENATOR OF PHILIPPINES'][0];
								}
							})

							let regionName = `${normalizedName?.charAt(0).toUpperCase()}${normalizedName?.slice(1)}`
							layer.bindTooltip(
								`${regionName}<br>Top Candidate: ${topCandi?.CANDIDATE_NAME}<br>Votes: ${topCandi?.TOTAL_VOTES.toLocaleString()}`,
								{
									permanent: false,
									direction: "center",
									className: "candidate-tooltip",
								}
							);
						},
						mouseout: function (e) {
							layer.setStyle({
								weight: 1,
								color: "#000",
								opacity: 1,
							});
							layer.closeTooltip();
						},
					})
				},
			});
			return layer;
		})
		.catch((error) => {
			console.error(`Error loading ${geojsonUrl}:`, error);
			return null;
		});
}


// display cities
async function showCitiesForProvince(provinceFeature) {
	// console.error(provinceFeature,'provinceFeature');
	// alert(1)
	if (!allCitiesData) {
		return;
	}

	if (citiesLayer) map.removeLayer(citiesLayer);

	let provinceName = provinceFeature.properties.NAME_1

	const normalizedProvince = (provinceName || "unknown")
		.toLowerCase()
		.replace(/\s+/g, "");



	const region = provinceToRegion[normalizedProvince] || "Bangsamoro Autonomous Region in Muslim Mindanao";
	let regionName = formatRegionPayload(region);



	let loweredRegion;
	if (regionName === "region_iv-b_mimaropa_region") {
		regionName = "region_iv_b"
	}
	if (regionName === "region_iv-a_calabarzon") {
		regionName = "region_iv_a"
	} else if (regionName === "region_xiii_caraga") {
		regionName = "region_xiii"
	} else if (regionName === "region_xii_soccsksargen") {
		regionName = "region_xii";
	}

	const target = allLocations?.regions?.find((item) => {
		loweredRegion = item?.code
		if (item?.code === regionName) {
			return item;
		}
	});

	provinceName = toSnakeCase(provinceName).trim();

	if (provinceName === "agusandel_sur") {
		provinceName = "agusan_del_sur"
	} else if (provinceName === "surigaodel_sur") {
		provinceName = "surigao_del_sur"
	} else if (provinceName === "lanaodel_sur") {
		provinceName = "lanao_del_sur"
	} else if (provinceName === "lanaodel_norte") {
		provinceName = "lanao_del_norte"
	} else if (provinceName === "zamboangadel_norte") {
		provinceName = "zamboanga_del_norte"
	} else if (provinceName === "zamboangadel_sur") {
		provinceName = "zamboanga_del_sur"
	} else if (provinceName === "davaodel_sur") {
		provinceName = "davao_del_sur"
	}

	if (provinceName === "metropolitan_manila") {
		// If NCR, manually fetch the city data from each district
		var fRes = target?.places.map(prv => {
			const prvPath = `${BASE}/national_capital_region/${prv.code}`;
			const citiesPath = prv.subplaces.map(city => {
				return `${prvPath}/${city.code}.json`
			})

			return citiesPath
		})
			.flat()
			.map(async uri => {
				try {
					const res = await fetch(uri);
					const data = await res.json();
					return data
				} catch (error) {
					console.log(error, 'error fetcing on 1286')
				}
			})
	} else {
		const cities = target?.places?.find((item) => {
			if (provinceName === "maguindanao" && (item?.code === "maguindanao_del_norte")) {
				return item
			}

			if (item?.code.trim() === provinceName.trim()) {
				return item
			}
		})?.subplaces;

		var fRes = cities?.map(async (item) => {
			let code = item?.code?.replace("'", '_');
			const payload = `${BASE}/${loweredRegion}/${provinceName.replace(" ", '_')}/${code}.json`

			try {
				const res = await fetch(payload);
				return await res.json();
			} catch (error) {
				console.log(error, 'error fetcing on 1286')
			}
		})


	}

	const results = await Promise.all(fRes);
	var filteredCities = {
		type: "FeatureCollection",
		features: allCitiesData.features.filter(
			(feature) =>
				(feature.properties.NAME_1 || "").toLowerCase().replace(/\s+/g, "") ===
				normalizedProvince
		),
	};


	citiesLayer = L.geoJSON(filteredCities, {
		style: function (feature) {
			const cityName = feature.properties.NAME_2 || "unknown";
			const normalizedCity = cityName.toLowerCase().replace(/\s+/g, "");
			let topCandidate = null;
			let maxVotes = 0;


			const cityCandidates = citySenatoriablesData.filter(
				(c) =>
					c.city.toLowerCase().replace(/\s+/g, "") === normalizedCity &&
					(feature.properties.NAME_1 || "")
						.toLowerCase()
						.replace(/\s+/g, "") === normalizedProvince
			);

			cityCandidates.forEach((candidate) => {
				if (candidate.votes > maxVotes) {
					maxVotes = candidate.votes;
					topCandidate = candidate;
				}
			});

			const target = results?.find((item) => normalizeCityName(item?.municipal) === normalizeCityName(cityName));
			const topSenate = target?.results['SENATOR OF PHILIPPINES'][0];

			const HEX = staticCandidate?.find((item) => item?.CANDIDATE_NAME === topSenate?.CANDIDATE_NAME)?.HEX_CODE || '#eb4034';

			return {
				fillColor: HEX,
				weight: 1,
				opacity: 0.8,
				color: "#000",
				fillOpacity: 0.5,
			};
		},
		onEachFeature: function (feature, layer) {
			const cityName = feature.properties.NAME_2 || "Unknown City";
			const normalizedCity = cityName.toLowerCase().replace(/\s+/g, "");
			let topCandidate = null;
			let maxVotes = 0;


			const cityCandidates = citySenatoriablesData.filter(
				(c) =>
					c.city.toLowerCase().replace(/\s+/g, "") === normalizedCity &&
					(feature.properties.NAME_1 || "")
						.toLowerCase()
						.replace(/\s+/g, "") === normalizedProvince
			);

			cityCandidates.forEach((candidate) => {

				if (candidate.votes > maxVotes) {
					maxVotes = candidate.votes;
					topCandidate = candidate;
				}
			});

			const target = results?.find((item) => normalizeCityName(item.municipal) === normalizeCityName(cityName));
			const topSenate = target?.results['SENATOR OF PHILIPPINES'][0];

			const candidateName = topCandidate
				? topCandidate.candidateName
				: "No Candidate";
			const displayCityName =
				normalizedCity === normalizedProvince ? `${cityName} City` : cityName;

			layer.bindTooltip(
				`${displayCityName}<br>Top Candidate: ${topSenate?.CANDIDATE_NAME} <br>Votes: ${topSenate?.TOTAL_VOTES.toLocaleString()}`,
				{
					permanent: false,
					direction: "center",
					className: "candidate-tooltip",
				}
			);

			layer.on({
				mouseover: function (e) {
					layer.setStyle({
						weight: 3,
						color: "#00BFFF",
						opacity: 1,
					});
					layer.openTooltip(layer.getBounds().getCenter());
				},
				mouseout: function (e) {
					layer.setStyle({
						weight: 1,
						color: "#000",
						opacity: 0.8,
					});
					layer.closeTooltip();
				},
				click: async function (e) {
					clearHighlightedLayers();
					highlightLayer(layer);
					updateInfoBox(displayCityName, `under ${provinceName}`);

					let tmpUrl = "";
					tmpUrl += formatPath(`${region}/`);
					tmpUrl += formatPath(`${cityName}.json`);

					function normalizeCityNameToSnakeCase(name) {
						return name
							.toLowerCase()
							.replace(/_/g, "")            // remove underscores
							.replace(/\s+/g, "")          // remove spaces
							.replace(/^cityof/, "")       // remove "cityof" prefix
							.replace(/^city/, "")         // remove "city" prefix
							.replace(/city$/, "")         // remove "city" suffix
							.trim();
					}

					const regionRef = allLocations.regions.find(reg => reg.code === regionName)
					const cityCode = Object.values(regionRef.places)
						.map(dist => dist.subplaces.map(x => x.code))
						.flat()
						.find(x => {
							return normalizeCityNameToSnakeCase(x) === normalizeCityNameToSnakeCase(cityName === 'KalookanCity' ? 'CaloocanCity' : cityName)
						})

					const provinceRef = Object.values(regionRef.places)
						.find(dist => dist.subplaces.find(x => x.code === cityCode))

					provinceName = provinceRef.code
					// updateListAndMap(`summary/${regionRef.code}/${provinceName}/${cityCode}.json`);

					const data = await queryData({
						region: regionRef.code,
						province: provinceName,
						city: cityCode
					});

					const results = data.results;

					// Example: Activate the "Local Race" tab
					// activateTab('[data-type="senators"]');
					//   const {results} = await queryData(payload, provLayer.feature.properties.NAME_1);
					// activateTab('[data-type="localrace"]');

					// const newRes = Object.entries(results)?.map(([key, val])=>{
					// 	return {
					// 		key: key.split(" ").join("_"),
					// 		val
					// 	}
					// })

					generateLocalRaceHTML(results, "city")
					displaySenatorialData(results['SENATOR OF PHILIPPINES'], 'dito');
					displayPartylistData(results['PARTY LIST OF PHILIPPINES']);

					// here
					// updateElectionResults("city", cityName);
					// map.fitBounds(layer.getBounds(), {
					//   padding: [50, 50]
					// });
				},
			});
		},
	}).addTo(map);

	// updateInfoBox(provinceName, `under ${region}`);
	// updateElectionResults("province", provinceName);
}

// function showCitiesForNCR() {
//   if (!allCitiesData) {
//     console.error("Cities data not loaded yet");
//     return;
//   }
//   if (citiesLayer) map.removeLayer(citiesLayer);

//   const ncrCities = {
//     type: "FeatureCollection",
//     features: allCitiesData.features.filter(
//       feature => (feature.properties.NAME_1 || "").toLowerCase().includes("metropolitanmanila")
//     )
//   };

//   citiesLayer = L.geoJSON(ncrCities, {
//     style: function(feature) {
//       const cityName = feature.properties.NAME_2 || "unknown";
//       const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
//       let topCandidate = null;
//       let maxVotes = 0;

//       const cityCandidates = citySenatoriablesData.filter(c =>
//         c.city.toLowerCase().replace(/\s+/g, '') === normalizedCity
//       );

//       cityCandidates.forEach(candidate => {
//         if (candidate.votes > maxVotes) {
//           maxVotes = candidate.votes;
//           topCandidate = candidate;
//         }
//       });

//       const fillColor = topCandidate ? topCandidate.candidateColor : '#FFFFFF';
//       return {
//         fillColor: fillColor,
//         weight: 1,
//         opacity: 0.8,
//         color: '#000',
//         fillOpacity: 0.5
//       };
//     },
//     onEachFeature: function(feature, layer) {
//       const cityName = feature.properties.NAME_2 || "Unknown City";
//       const normalizedCity = cityName.toLowerCase().replace(/\s+/g, '');
//       let topCandidate = null;
//       let maxVotes = 0;

//       const cityCandidates = citySenatoriablesData.filter(c =>
//         c.city.toLowerCase().replace(/\s+/g, '') === normalizedCity
//       );

//       cityCandidates.forEach(candidate => {
//         if (candidate.votes > maxVotes) {
//           maxVotes = candidate.votes;
//           topCandidate = candidate;
//         }
//       });

//       const candidateName = topCandidate ? topCandidate.candidateName : "No Candidate";

//       layer.bindTooltip(`${cityName}<br>Top Candidate: ${candidateName}`, {
//         permanent: false,
//         direction: 'center',
//         className: 'candidate-tooltip'
//       });

//       layer.on({
//         mouseover: function(e) {
//           if (!highlightedLayers.includes(layer)) {
//             layer.setStyle({
//               weight: 3,
//               color: '#00BFFF',
//               opacity: 1
//             });
//           }
//           layer.openTooltip(layer.getBounds().getCenter());
//         },
//         mouseout: function(e) {
//           if (!highlightedLayers.includes(layer)) {
//             layer.setStyle({
//               weight: 1,
//               color: '#000',
//               opacity: 0.8
//             });
//           }
//           layer.closeTooltip();
//         },
//         click: function(e) {
//           clearHighlightedLayers();
//           highlightLayer(layer);
//           updateInfoBox(cityName, "under National Capital Region");
//           // updateElectionResults("city", cityName);
//           // map.fitBounds(layer.getBounds(), {
//           //   padding: [50, 50]
//           // });
//         }
//       });
//     }
//   }).addTo(map);

//   ncrCities.features.forEach(cityFeature => {
//     citiesLayer.eachLayer(layer => {
//       if (layer.feature === cityFeature) {
//         highlightLayer(layer);
//       }
//     });
//   });

//   // updateElectionResults("region", "National Capital Region");
// }

// function updateElectionResults(level, name) {
//   let jsonPath;
//   if (level === 'region') {
//     jsonPath = `${BASE_URL}/assets/BP2025/data/results_senators_national.json`;
//     console.log('Loading REGIONAL data');
//   } else if (level === 'city') {
//     jsonPath = `${BASE_URL}/assets/BP2025/data/results_senators_national.json`;
//     console.log('Loading CITY data');
//   } else {
//     jsonPath = `${BASE_URL}/assets/BP2025/data/results_senators_national.json`;
//     console.log('Loading NATIONAL data');
//   }

//   fetch(jsonPath)
//     .then(response => {
//       if (!response.ok) {
//         console.error('Failed to load data:', response.status);
//         throw new Error('Network response was not ok');
//       }
//       return response.json();
//     })
//     .then(data => {
//       console.log("Data loaded successfully:", data);
//       let displayData;
//       if (level === 'city') {
//         displayData = data.filter(senator =>
//           senator.city.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, '')
//         );
//       } else {
//         displayData = data;
//       }
//       console.log(`Displaying ${level.toUpperCase()} candidates:`, displayData.length);
//       if (displayData.length === 0) {
//         console.warn("WARNING: No data to display!");
//       }
//       displaySenatorialData(displayData, level, name);
//     })
//     .catch(error => {
//       console.error('Error loading data:', error);
//       displayError();
//     });
// }
function updateElectionResults(level, name) {
	const data = electionData.senators;
	let filteredData = [];

	if (level === "national") {
		filteredData = data;
	} else {
		filteredData = data.filter((candidate) => candidate[level] && candidate[level].toLowerCase().replace(/\s+/g, "") === name.toLowerCase().replace(/\s+/g, ""));
	}

	if (filteredData.length === 0) {
		displaySenatorialData(data.slice(0, 12), "national"); // Show top 12 as fallback
	} else {
		displaySenatorialData(filteredData, level);
	}
}

document.querySelector(".btn-light[onclick*='setView']").addEventListener("click", async () => {
	const res = await fetch(`./assets/json/data_ready.json`);
	const READY = await res.json();

	if (!READY.status) {
		return drawMap()
	}

	map.setView([12.8797, 121.774], 5.48);
	document.getElementById("info-box").style.display = "none";

	if (citiesLayer) map.removeLayer(citiesLayer);
	provincesLayer.eachLayer((provLayer) => {
		provLayer.setStyle({
			fillColor: "#FFFFFF",
			weight: 1,
			opacity: 0.8,
			color: "#000",
			fillOpacity: 0.9,
		});
	});

	map.fitBounds(provincesLayer.getBounds());
	currentRegion = null;
	clearHighlightedLayers();
	updateElectionResults("national");
	await queryMappedData()
	const { timestamp, results } = await queryData({ national: 'national' });
	if (results) {
		displayPartylistData(results.partyList);
		displaySenatorialData(results.senatorial);
	}
	activateTab('[data-type="senators"]');

	drawMap()
});