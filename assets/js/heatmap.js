
document.querySelector("[data-bs-target='#heatmap']").addEventListener("click", async () => {
	await loadHeatMap();
	console.log("clicked");
});

let map2;
// let isNational = true;
// let isProvincial = false;

const provinceToRegion2 = {};
for (let province in provinceToRegionOriginal) {
	const normalizedKey = province.toLowerCase().replace(/\s+/g, "");
	provinceToRegion2[normalizedKey] = provinceToRegionOriginal[province];
}

var countryLayer2, provincesLayer2, citiesLayer2;
var allProvincesData2, allCitiesData2;
var currentRegion2 = null;

var highlightedLayers2 = [];
let blinkInterval2 = null;

let citySenatoriablesData2 = [];

// Call on page load
document.addEventListener("DOMContentLoaded", async () => {
	// await loadHeatMap();
	// await loadCitySenatoriables();
	// updateElectionResults2('national');
	// const {results} = await queryData({national:'nationals'});

	// displaySenatorialData(results?.senatorial)
	// displayPartylistData(results?.partyList)


});




function buildLocalPayload2(timestamp, governor, vice, house, mayor, viceMayor, councilor){
	const payload = {
		timestamp,
		results:{
			governor:governor?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),	
			vice_governor:vice?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),
			house_of_representatives:house?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),
			mayor:mayor?.length && house?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),
			vice_mayor:viceMayor?.length && house?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),
			councilor:councilor?.length && councilor?.map((item)=>{
				return {
					CANDIDATE_NAME:item.candidate,
					TOTAL_VOTES:item?.votes
				}
			}),
		}
	}
	console.log(payload,'payload')
	generateLocalRaceHTML(payload)
}

function highlightRegionOnMap(regionName) {
	if (!provincesLayer2) return;

	clearHighlightedLayers22();
	const regionBounds = L.latLngBounds();
	let hasProvinces = false;

	// Remove cities layer if it exists
	if (citiesLayer2) {
		map2.removeLayer(citiesLayer2);
		citiesLayer2 = null;
	}

	provincesLayer2.eachLayer((layer) => {
		const layerProvince = layer.feature?.properties.NAME_1;
		if (layerProvince) {
			const normalizedName = layerProvince.toLowerCase().replace(/\s+/g, "");
			const region = provinceToRegion[normalizedName];

			if (region === regionName) {
				highlightLayer2(layer);
				regionBounds.extend(layer.getBounds());
				hasProvinces = true;
			}
		}
	});

	if (hasProvinces) {
		map2.fitBounds(regionBounds, { padding: [50, 50] });
		updateInfoBox2(
			regionName,
			regionName === "National Capital Region" ? "NCR" : regionName
		);
		currentRegion2 = regionName;
	}
}

function highlightProvinceOnMap2(provinceName, cityName) {

	// clickedByHeader2({region})
	updateInfoBox2(provinceName, `under ${region}`);

	if (!provincesLayer2) return;

	clearHighlightedLayers22();
	let found = false;
	  // updateMenuSelection('province', provinceName);


	provincesLayer2.eachLayer((layer) => {
		const layerProvince = layer.feature?.properties.NAME_1;
		if (
			layerProvince &&
			layerProvince.toLowerCase() === provinceName.toLowerCase()
		) {
			highlightLayer2(layer);
			found = true;

			// Find the corresponding feature in the original data
			const feature = allProvincesData2.features.find(
				(f) => f.properties.NAME_1.toLowerCase() === provinceName.toLowerCase()
			);

			if (feature) {
				// Show cities for this province
				showCitiesForProvince2(feature);
				map2.fitBounds(layer.getBounds());
			}
			return;
		}
	});

	if (!found) {
		console.warn(`Province not found: ${provinceName}`);
	}
}

async function clickedByHeader2({region, province, city}){
	

	let regionF = formatRegionPayload(region);

	
	if(city){
		const {results} = await queryData({
			region:regionF,
			province,
			city
		});
		
		buildLocalPayload2('-',results['PROVINCIAL GOVERNOR OF ABRA'],results['PROVINCIAL VICE-GOVERNOR OF ABRA'],results['MEMBER, HOUSE OF REPRESENTATIVES OF ABRA - LONE LEGDIST'], results['MAYOR OF ABRA - BANGUED'],results['VICE-MAYOR OF ABRA - BANGUED'], results['MEMBER, SANGGUNIANG PANLALAWIGAN OF ABRA - SECOND PROVDIST'])
		activateTab2('[data-type="localrace"]');
	

	}else if(region){

		const {results} = await queryData({
			region:regionF
		});
	
		
		buildLocalPayload2('-',results['PROVINCIAL GOVERNOR OF ABRA'],results['PROVINCIAL VICE-GOVERNOR OF ABRA'],results['MEMBER, HOUSE OF REPRESENTATIVES OF ABRA - LONE LEGDIST'])
		activateTab2('[data-type="localrace"]');

	}
}

function highlightCityOnMap2(cityName, provinceName, region) {
	
	clickedByHeader2({
		region,
		province:provinceName,
		city:cityName
	})

	// First ensure the province is highlighted and cities are shown
	highlightProvinceOnMap2(provinceName, cityName);

	const displayCityName = cityName.toLowerCase() === provinceName.toLowerCase() 
  ? `${cityName} City` 
  : cityName;
updateInfoBox2(displayCityName, `under ${provinceName}`);
	// Then try to find and highlight the city
	const tryHighlightCity = () => {
		if (!citiesLayer2) {
			setTimeout(tryHighlightCity, 100);
			return;
		}

		let cityFound = false;
		citiesLayer2.eachLayer((layer) => {
			const layerCity = layer.feature?.properties.NAME_2;
			const layerProvince = layer.feature?.properties.NAME_1;

			if (
				layerCity &&
				layerProvince &&
				layerCity.toLowerCase() === cityName.toLowerCase() &&
				layerProvince.toLowerCase() === provinceName.toLowerCase()
			) {
				clearHighlightedLayers22();
				highlightLayer2(layer);
				map2.fitBounds(layer.getBounds());

				// Update info box
				const displayCityName =
					cityName.toLowerCase() === provinceName.toLowerCase()
						? `${cityName} City`
						: cityName;
				updateInfoBox2(displayCityName, `under ${provinceName}`);
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

// Modified showCitiesForProvince2 to handle highlighting better
function showCitiesForProvince2(provinceFeature) {
	alert("showCitiesForProvince2")
	if (!allCitiesData2) {
		console.error("Cities data not loaded yet");
		return;
	}

	// Remove existing cities layer if it exists
	if (citiesLayer2) {
		map2.removeLayer(citiesLayer2);
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
		features: allCitiesData2.features.filter(
			(feature) =>
				(feature.properties.NAME_1 || "").toLowerCase().replace(/\s+/g, "") ===
				normalizedProvince
		),
	};

	citiesLayer2 = L.geoJSON(filteredCities, {
		style: function (feature) {
			// ... existing style code ...
		},
		onEachFeature: function (feature, layer) {
			// ... existing onEachFeature code ...
		},
	}).addTo(map2);

	updateInfoBox2(provinceName, `under ${region}`);
}



function highlightLayer2(layer) {
	layer.setStyle({
		weight: 5,
		color: "#1E90FF",
		dashArray: null,
		opacity: 1,
		// fillOpacity: layer.options.fillOpacity,
	});
	layer.bringToFront();
	layer.redraw();

	let opacity = 1;
	if (!blinkInterval2) {
		blinkInterval2 = setInterval(() => {
			opacity = opacity === 1 ? 0.7 : 1;
			highlightedLayers2.forEach((l) => {
				l.setStyle({
					opacity: opacity,
				});
			});
		}, 800);
	}
	highlightedLayers2.push(layer);
}

function clearHighlightedLayers22() {
	highlightedLayers2.forEach((layer) => {
		layer.setStyle({
			weight: 1,
			opacity: 0.8,
			color: "#000",
			dashArray: null,
			fillOpacity: layer.options.fillOpacity,
		});
		layer.redraw();
	});
	highlightedLayers2 = [];
	if (blinkInterval2) {
		clearInterval(blinkInterval2);
		blinkInterval2 = null;
	}
}

function updateInfoBox2(name, underText) {
	const infoBox = document.getElementById("info-box");
	infoBox.style.display = "block";
	infoBox.style.zIndex = "1";
  infoBox.innerHTML = `<div class="name">${name}</div><hr><div class="under">${underText}</div>	`;
	document.getElementById("selected-place").textContent = name;

}

function addLayer2(geojsonUrl, nameProperty, styleOptions, onClickHandler) {
	return fetch(geojsonUrl)
		.then((response) => response.json())
		.then((data) => {
		
			
			if (nameProperty === "NAME_1") allProvincesData2 = data;
			if (nameProperty === "NAME_2") allCitiesData2 = data;

			var layer = L.geoJSON(data, {
				style: function (feature) {
					// console.log(nameProperty,'nameProperty');
					

					if (nameProperty === "NAME_1") {
						const normalizedName = (feature.properties.NAME_1 || "unknown")
							.toLowerCase()
							.replace(/\s+/g, "");
							
						const region =
							provinceToRegion[normalizedName] ||
							"Bangsamoro Autonomous Region in Muslim Mindanao";
						let topCandidate = null;
						if (currentRegion2 === region) {
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
						// console.log(topCandidate,'topCandidate')
						const alp = ['a','b','c','d','e','f','g','h','i','A','B',1,2,3,4,5,6,7,8,]
						const ran = Math.ceil(Math.random() * alp.length)+1;
	// general color
						return {
							// fillColor: topCandidate ? topCandidate.color : `#${alp[ran]}${alp[ran]}${alp[ran]}${ran}${ran}${alp[ran]}`,

							fillColor: "#471E1E",
							weight: 1,
							opacity: 0.8,
							color: "#000",
							fillOpacity: 0.9,
						};
					} else if (nameProperty === "NAME_2") {
						return {
							// fillColor: "#FFFFFF",
							fillColor:"#fff",
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
					if (onClickHandler) {
						layer.on("click", function (e) {
							// console.log(e);
							onClickHandler(feature, layer, e);
						});
					}
				},
			});
			return layer;
		})
		.catch((error) => {
			console.error(`Error loading ${geojsonUrl}:`, error);
			return null;
		});
}

function showCitiesForProvince2(provinceFeature) {
	if (!allCitiesData2) {
		console.error("Cities data not loaded yet");
		return;
	}
	if (citiesLayer2) map2.removeLayer(citiesLayer2);

	const provinceName = provinceFeature.properties.NAME_1;
	const normalizedProvince = (provinceName || "unknown")
		.toLowerCase()
		.replace(/\s+/g, "");
	const region =
		provinceToRegion[normalizedProvince] ||
		"Bangsamoro Autonomous Region in Muslim Mindanao";

	var filteredCities = {
		type: "FeatureCollection",
		features: allCitiesData2.features.filter(
			(feature) =>
				(feature.properties.NAME_1 || "").toLowerCase().replace(/\s+/g, "") ===
				normalizedProvince
		),
	};

	citiesLayer2 = L.geoJSON(filteredCities, {
		style: function (feature) {
			const cityName = feature.properties.NAME_2 || "unknown";
			const normalizedCity = cityName.toLowerCase().replace(/\s+/g, "");
			let topCandidate = null;
			let maxVotes = 0;

			const cityCandidates = citySenatoriablesData2.filter(
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

			const fillColor = topCandidate ? topCandidate.candidateColor : "#FFFFFF";
			return {
				fillColor: "#fff",
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

			const cityCandidates = citySenatoriablesData2.filter(
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

			const candidateName = topCandidate
				? topCandidate.candidateName
				: "No Candidate";
			const displayCityName =
				normalizedCity === normalizedProvince ? `${cityName} City` : cityName;

			layer.bindTooltip(
				`${displayCityName}<br>Top Candidate: ${candidateName} <br>Votes: ${maxVotes.toLocaleString()}`,
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
					clearHighlightedLayers22();
					highlightLayer2(layer);
					updateInfoBox2(displayCityName, `under ${provinceName}`);
					let tmpUrl = ""; 
					tmpUrl += formatPath(`${region}/`);
					tmpUrl += formatPath(`${cityName}.json`);
					updateListAndMap("summary/"+tmpUrl);

					let payload = formatRegionPayload(region)
					let pro = provinceName.toLowerCase().split(" ").join("_");
					let cName = cityName.toLowerCase();
					const {results} = await queryData({	regionFormatted:payload,
						province:pro,
						city:cName});
				
					  

					activateTab2('[data-type="localrace"]');


					
					buildLocalPayload2('-',results['PROVINCIAL GOVERNOR OF ABRA'],results['PROVINCIAL VICE-GOVERNOR OF ABRA'],results['MEMBER, HOUSE OF REPRESENTATIVES OF ABRA - LONE LEGDIST'], results['MAYOR OF ABRA - BANGUED'],results['VICE-MAYOR OF ABRA - BANGUED'], results['MEMBER, SANGGUNIANG PANLALAWIGAN OF ABRA - SECOND PROVDIST'])

					updateElectionResults2("city", cityName);

				},
			});
		},
	}).addTo(map2);

	updateInfoBox2(provinceName, `under ${region}`);
	// updateElectionResults2("province", provinceName);
}




function updateElectionResults2(level, name) {
	const data = electionData.senators;
	let filteredData = [];

	if (level === "national") {
		filteredData = data;
	} else {
		filteredData = data.filter((candidate) => candidate[level] && candidate[level].toLowerCase().replace(/\s+/g, "") === name.toLowerCase().replace(/\s+/g, ""));
	}

	console.log(`Filtered ${level.toUpperCase()} data:`, filteredData);

	if (filteredData.length === 0) {
		console.warn("No matching data found for:", name);
		// Optionally show a message or fallback to higher level data
		displaySenatorialData(data.slice(0, 12), "national"); // Show top 12 as fallback
	} else {
		displaySenatorialData(filteredData, level);
	}
}

document.querySelector(".btn-light[onclick*='setView']").addEventListener("click", () => {
  map2.setView([12.8797, 121.774], 5.48);
  document.getElementById("info-box").style.display = "none";
  
  // Clear the selected place text
  document.getElementById("selected-place").textContent = "the Philippines";
  
  if (citiesLayer2) map2.removeLayer(citiesLayer2);
  provincesLayer2.eachLayer((provLayer) => {
    provLayer.setStyle({
      fillColor: "#FFFFFF",
      weight: 1,
      opacity: 0.8,
      color: "#000",
      fillOpacity: 0.9,
    });
  });
  map2.fitBounds(provincesLayer2.getBounds());
  currentRegion2 = null;
  clearHighlightedLayers22();
  updateElectionResults2("national");
});


const getNormalizedName = (name = "unknown") => name.toLowerCase().replace(/\s+/g, "");

const bindProvinceTooltip = (layer, candidate, votes) => {
	const provinceName = layer.feature.properties.NAME_1;
	const candidateName = candidate ? candidate.candidateName : "No Candidate";
	layer.bindTooltip(
		`${provinceName}<br>Top Candidate: ${candidateName}<br>Votes: ${votes.toLocaleString()}`,
		{
			permanent: false,
			direction: "center",
			className: "candidate-tooltip",
		}
	);
};

const bindCityTooltip = (layer, cityName, candidate, votes) => {
	const candidateName = candidate ? candidate.candidateName : "No Candidate";
	layer.bindTooltip(
		`${cityName}<br>Top Candidate: ${candidateName} <br>Votes: ${votes.toLocaleString()}`,
		{
			permanent: false,
			direction: "center",
			className: "candidate-tooltip",
		}
	);
};

const handleProvinceClick = async (feature, layer) => {
	const normalizedName = getNormalizedName(feature.properties.NAME_1);
	const region = provinceToRegion[normalizedName] || "Bangsamoro Autonomous Region in Muslim Mindanao";

	clearHighlightedLayers22();
	updateInfoBox2(feature.properties.NAME_1, `under ${region}`);
	highlightLayer2(layer);
	map2.fitBounds(layer.getBounds());
	showCitiesForProvince2(feature);
	updateElectionResults2("province", feature.properties.NAME_1);

	provincesLayer2.eachLayer(async (provLayer) => {
		const provName = provLayer.feature.properties.NAME_1;
		const provNormalized = getNormalizedName(provName);
		let topCandidate = null;
		let maxVotes = -1;

		if (provName === feature.properties.NAME_1 && allCitiesData2) {
			const cities = allCitiesData2.features.filter(
				(city) => getNormalizedName(city.properties.NAME_1) === provNormalized
			);

			const regionFormatted = formatRegionPayload(region);
			const { results } = await queryData({ regionFormatted, province: provName });
			activateTab2('[data-type="localrace"]');

			buildLocalPayload2(
				'-',
				results['PROVINCIAL GOVERNOR OF ABRA'],
				results['PROVINCIAL VICE-GOVERNOR OF ABRA'],
				results['MEMBER, HOUSE OF REPRESENTATIVES OF ABRA - LONE LEGDIST']
			);

			const candidateVotes = {};
			cities.forEach((city) => {
				const cityName = getNormalizedName(city.properties.NAME_2);
				const candidates = citySenatoriablesData2.filter(
					(c) => getNormalizedName(c.city) === cityName && getNormalizedName(c.NAME_1) === provNormalized
				);
				candidates.forEach((c) => {
					candidateVotes[c.candidateName] = (candidateVotes[c.candidateName] || 0) + c.votes;
				});
			});

			for (const [name, totalVotes] of Object.entries(candidateVotes)) {
				if (totalVotes > maxVotes) {
					maxVotes = totalVotes;
					topCandidate = citySenatoriablesData2.find((c) => c.candidateName === name);
				}
			}

			bindProvinceTooltip(provLayer, topCandidate, maxVotes);
		}

		provLayer.setStyle({
			// fillColor: provName === feature.properties.NAME_1 && topCandidate ? topCandidate.candidateColor : "#FFFFFF",
			fillColor: "#fff",
			weight: 1,
			opacity: 0.8,
			color: "#000",
			fillOpacity: 0.9,
		});
	});
};

const handleCityFeature = (feature, layer) => {
	const cityName = feature.properties.NAME_2 || "Unknown City";
	const provinceName = feature.properties.NAME_1 || "Unknown Province";
	const normalizedCity = getNormalizedName(cityName);
	let topCandidate = null;
	let maxVotes = 0;

	const candidates = citySenatoriablesData2.filter(
		(c) =>
			getNormalizedName(c.city) === normalizedCity &&
			getNormalizedName(c.NAME_1) === getNormalizedName(provinceName)
	);

	candidates.forEach((c) => {
		if (c.votes > maxVotes) {
			maxVotes = c.votes;
			topCandidate = c;
		}
	});

	bindCityTooltip(layer, cityName, topCandidate, maxVotes);

	layer.on({
		mouseover: () => {
			layer.setStyle({ weight: 3, color: "#00BFFF", opacity: 1 });
			layer.openTooltip(layer.getBounds().getCenter());
		},
		mouseout: () => {
			layer.setStyle({ weight: 1, color: "#000", opacity: 0.8 });
			layer.closeTooltip();
		},
		click: () => {
			console.log("clicked city");
			clearHighlightedLayers22();
			highlightLayer2(layer);
			updateInfoBox2(cityName, `under ${provinceName}`);
			updateElectionResults2("city", cityName);
			map2.fitBounds(layer.getBounds(), { padding: [50, 50] });
		},
	});
};

const loadHeatMap = async () => {
	if (!map2 || !(map2 instanceof L.Map)) {
		map2 = L.map("map2", {
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
	}

Promise.all([
	addLayer2(BASE_URL + "/assets/BP2025/data/gadm41_PHL_0.json", "COUNTRY", {
		fillColor: "#fff",
		weight: 2,
		opacity: 1,
		color: "#fff",
		fillOpacity: 0,
	}),
	addLayer2(
		BASE_URL + "/assets/BP2025/data/gadm41_PHL_1.json",
		"NAME_1",
		{ fillColor: "#fff"},
		handleProvinceClick
	),
	addLayer2(
		BASE_URL + "/assets/BP2025/data/gadm41_PHL_2.json",
		"NAME_2",
		{			fillColor: "#fff" },
		handleCityFeature
	),
])
	.then(([country, provinces, cities]) => {
		countryLayer2 = country;
		provincesLayer2 = provinces;
		citiesLayer2 = cities;

		if (!provincesLayer2) console.error("Provinces layer failed to load");
		if (!citiesLayer2) console.error("Cities layer failed to load");

		countryLayer2.addTo(map2);
		provincesLayer2.addTo(map2);
		map2.fitBounds(provincesLayer2.getBounds());
	})
	.catch((error) => console.error("Error loading layers:", error));
};
// 