let regionHover

function isMobile() {
	return window.matchMedia("(max-width: 768px)").matches;
}
// Global

async function fetchApi(url) {
	try {
		const response = await fetch(url, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Fetch error:", error.message);
		return null;
	}
}

//
// fetch election results data
//
async function fetchRegions() {
	const regionsUrl = "./assets/json/regions_philippines.json";

	try {
		const regions = await fetchApi(regionsUrl);
		return regions;
	} catch (error) {
		console.error("Region data fetch failed:", error);
		return null;
	}
}

function createPlaceElement(place, regionName = null) {
	const placeItem = document.createElement("li");
	placeItem.className = "place-item d-flex p-0 m-0 flex-column w-100";
	const modal = bootstrap.Modal.getInstance(document.getElementById("menu"));
	if (place.subplaces?.length) {
		// This is a province with cities
		placeItem.innerHTML = `
      <div class="accordion border-0" id="accordion-${place.name.replace(
			/\s+/g,
			"-"
		)}" style="margin: 0; padding: 0;">
        <div class="accordion-item border-0 bg-transparent">
          <h2 class="accordion-header" id="heading-${place.name.replace(
			/\s+/g,
			"-"
		)}">
            <button class="accordion-button collapsed d-flex align-items-center justify-content-between position-relative bg-transparent shadow-none" 
                    type="button" 
                    aria-expanded="false" 
                    aria-controls="collapse-${place.name.replace(/\s+/g, "-")}"
                    style="transition: all 0.2s; padding-left: 0; margin: 0;" data-type="${regionName}">
              <div class="d-flex align-items-center">
           
                <span style="font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 16px; color: #212529; text-decoration: none; margin-left: 8px;">${place.name
			}</span>
              </div>
              <div class="custom-accordion-toggle" data-bs-toggle="collapse" data-bs-target="#collapse-${place.name.replace(
				/\s+/g,
				"-"
			)}">
                <svg class="custom-accordion-icon" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="black"/>
                </svg>
              </div>
            </button>
          </h2>
          <div id="collapse-${place.name.replace(/\s+/g, "-")}" 
              class="accordion-collapse collapse border-0" 
              aria-labelledby="heading-${place.name.replace(/\s+/g, "-")}" 
              data-bs-parent="#accordion-${place.name.replace(/\s+/g, "-")}">
            <div class="accordion-body" style="padding: 0;">
              <ul class="list-unstyled subplaces"></ul>
            </div>
          </div>
        </div>
      </div>
    `;

		// Add hover effects
		const button = placeItem.querySelector(".accordion-button");
		button.addEventListener("mouseover", function () {
			// this.style.backgroundColor = "#E1E1E1";
			// this.querySelector(".star-icon").style.opacity = "1";
		});

		button.addEventListener("mouseout", function () {
			// this.style.backgroundColor = "transparent";
			// this.querySelector(".star-icon").style.opacity = "0";
		});

		button.addEventListener("click", async function () {
			const regionName = button.getAttribute("data-type").trim().replace(/[\s-]+/g, '_').toLowerCase();
			document.getElementById("selected-place").textContent = place.name;
			// console.log(place.name, regionName);
			highlightProvinceOnMap(place.name, regionName);
			// updateElectionResults("province", place.name);
			if (modal) modal.hide();
			document.querySelectorAll('.modal.show').forEach(modalEl => {
				const modalInstance = bootstrap.Modal.getInstance(modalEl);
				if (modalInstance) {
					modalInstance.hide();
				}
			});

			try {
				// console.log({ region: regionName, province: place.code.trim().replace(/[\s-]+/g, '_').toLowerCase() });
				// console.log('READY', READY)
				const data = await queryData({ region: regionName, province: place.name.trim().replace(/[\s-]+/g, '_').toLowerCase() });
				// console.log('data:', data)
				const { timestamp, percentage, results } = data;

				// console.log(data);
				// console.log('----', results)
				await queryMappedData("province");

				// Update all timestamp displays
				updateTimestampDisplay(timestamp, 200);
				// updatePercentageDisplay(percentage, 200)

				// Display data
				if (results) {
					generateLocalRaceHTML(results, "city");
					displaySenatorialData(results['SENATOR OF PHILIPPINES'], 'dito');
					displayPartylistData(results['PARTY LIST OF PHILIPPINES']);
				}
			} catch (error) {
				console.log(error);
				updateTimestampDisplay('Error loading data');
				updatePercentageDisplay('0')
			}
		});

		// Handle custom accordion icon toggling
		const toggle = placeItem.querySelector(".custom-accordion-toggle");
		toggle.addEventListener("click", function (e) {
			e.stopPropagation();
		});

		const collapseElement = placeItem.querySelector(
			`#collapse-${place.name.replace(/\s+/g, "-")}`
		);
		collapseElement.addEventListener("show.bs.collapse", function () {
			const icon = placeItem.querySelector(".custom-accordion-icon");
			icon.setAttribute("viewBox", "0 0 14 2");
			icon.innerHTML = '<path d="M14 2H0V0H14V2Z" fill="black"/>';
		});

		collapseElement.addEventListener("hide.bs.collapse", function () {
			const icon = placeItem.querySelector(".custom-accordion-icon");
			icon.setAttribute("viewBox", "0 0 14 14");
			icon.innerHTML =
				'<path d="M14 8H8V14H6V8H0V6H6V0H8V6H14V8Z" fill="black"/>';
		});

		const subplaceList = placeItem.querySelector(".subplaces");
		// console.log(place);
		place.subplaces.forEach((subplace) => {
			const subplaceItem = createPlaceElement(subplace, regionName);
			subplaceList.appendChild(subplaceItem);
		});
	} else {
		// This is a city
		// onmouseover = "this.style.backgroundColor='#E1E1E1'; this.querySelector('svg').style.opacity='1'; this.style.borderRadius='4px'"
		// onmouseout = "this.style.backgroundColor='transparent'; this.querySelector('svg').style.opacity='0'; this.style.borderRadius='0'
		placeItem.innerHTML = `
      <div class="d-flex align-items-center position-relative p-0 m-0" 
           style="transition: all 0.2s;"
           ">
        
        <span class="ms-2 w-100 py-3" style="cursor:pointer; font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 16px; color: #212529; text-decoration: none; margin-left: 8px;">${place.name}</span>
      </div>
    `;

		const div = placeItem.querySelector("div");
		// Inside the else block of createPlaceElement (for cities)

		// cities
		div.addEventListener("click", async function () {

			// Get province name from parent
			const provinceName = this.closest(".accordion-item")?.querySelector(
				".accordion-button span"
			)?.textContent;
			// const region = this.closest(".accordion-item")?.querySelector(
			// 	".accordion-header span"
			// )?.textContent;
			const region2 = regionHover;
			if (provinceName) {
				highlightCityOnMap(place.name, provinceName, region2);
				// updateElectionResults("city", place.name);
				// console.log(place.name);
				// console.log("cityyyyyyyyyyyyyyyyy");
				// try {
				// 	console.log({ region: region2, province: place.code.trim().replace(/[\s-]+/g, '_').toLowerCase() });
				// 	// console.log('READY', READY)
				// 	const data = await queryData({ region: regionName, province: place.name.trim().replace(/[\s-]+/g, '_').toLowerCase(), city: place.name.trim().replace(/[\s-]+/g, '_').toLowerCase() });
				// 	// console.log('data:', data)
				// 	const { timestamp, percentage, results } = data;

				// 	console.log(data);
				// 	// console.log('----', results)
				// 	// Update all timestamp displays
				// 	updateTimestampDisplay(timestamp, 200);
				// 	// updatePercentageDisplay(percentage, 200)

				// 	// Display data
				// 	if (results) {
				// 		generateLocalRaceHTML(results, "city");
				// 		displaySenatorialData(results['SENATOR OF PHILIPPINES'], 'dito');
				// 		displayPartylistData(results['PARTY LIST OF PHILIPPINES']);
				// 	}
				// } catch (error) {
				// 	console.log(error);
				// 	updateTimestampDisplay('Error loading data');
				// 	updatePercentageDisplay('0')
				// }
			}
			document.getElementById("selected-place").textContent = place.name;

			// Close all modals properly
			const mainModal = bootstrap.Modal.getInstance(
				document.getElementById("menu")
			);
			const placesModal = bootstrap.Modal.getInstance(
				document.getElementById("mobilePlacesModal")
			);

			// Hide the mobile places modal first
			if (placesModal) {
				placesModal.hide();
			}

			// Then hide the main menu modal
			if (mainModal) {
				mainModal.hide();
			}

			// Manually remove any remaining backdrop
			document.querySelectorAll(".modal-backdrop").forEach((el) => el.remove());

			// Re-enable body scrolling
			document.body.style.overflow = "auto";
			document.body.style.paddingRight = "0";

			document.querySelectorAll('.modal.show').forEach(modalEl => {
				const modalInstance = bootstrap.Modal.getInstance(modalEl);
				if (modalInstance) {
					modalInstance.hide();
				}
			});
		});
	}
	return placeItem;
}

function showPlacesInRightColumn(places, regionName) {
	const container = document.getElementById("places-container");
	container.innerHTML = `
    <ul class="list-unstyled" style="padding: 0; margin: 0;" id="places-list"></ul>
  `;

	const placesList = document.getElementById("places-list");

	places.forEach((place) => {
		placesList.appendChild(createPlaceElement(place, regionName));
	});
}

// function createRegionElement(region) {
//   const regionItem = document.createElement('li');
//   regionItem.className = 'region-item w-100 ms-1 px-2';

//   regionItem.innerHTML = `
//     <div class="d-flex justify-content-between align-items-center"
//          style="transition: background-color 0.2s; border-radius: 4px;"
//          onmouseover="this.style.backgroundColor='#E1E1E1'"
//          onmouseout="this.style.backgroundColor='transparent'">
//       <div class="d-flex align-items-center" style="cursor:default; width: 100%;">
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
//           <path d="M12 8.7225L13.08 11.2725L13.98 11.3475L15.8325 11.505L13.74 13.32L13.9425 14.205L14.3625 16.0125L12.7725 15.0525L12 14.5725L11.2275 15.0375L9.6375 15.9975L10.0575 14.19L10.26 13.305L8.1675 11.49L10.02 11.3325L10.92 11.2575L11.2725 10.425L12 8.7225ZM12 4.875L9.8925 9.8475L4.5 10.305L8.595 13.8525L7.365 19.125L12 16.3275L16.635 19.125L15.405 13.8525L19.5 10.305L14.1075 9.8475L12 4.875Z" fill="black" class="star-none" />
//         </svg>
//         <span class="region-name rounded ms-1 region-name w-100 p-2 lh-base text-truncate" style="max-width: 260px; font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 16px; color: #212529; text-decoration: none; margin-left: 8px;">
//           ${region.name}
//         </span>
//       </div>
//       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
//         <mask id="mask0_1672_6286" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
//           <rect width="24" height="24" fill="#D9D9D9" />
//         </mask>
//         <g mask="url(#mask0_1672_6286)">
//           <path d="M12.6 12L8 7.4L9.4 6L15.4 12L9.4 18L8 16.6L12.6 12Z" fill="black" fill-opacity="0.2" />
//         </g>
//       </svg>
//     </div>
//   `;

//   const regionDiv = regionItem.querySelector('div');

//   // Prevent any click behavior on the region
//   regionDiv.addEventListener('click', function(e) {
//     e.preventDefault();
//     e.stopPropagation();
//     return false;
//   });

//   // Keep the hover functionality to show sub-places
//   regionItem.addEventListener('mouseenter', () => {
//     regionDiv.style.backgroundColor = '#f8f9fa';
//     showPlacesInRightColumn(region.places, region.name);
//   });

//   regionItem.addEventListener('mouseleave', () => {
//     regionDiv.style.backgroundColor = 'transparent';
//   });

//   return regionItem;
// }
// function renderRegions(regionsData) {
//   const container = document.getElementById('regions-container');
//   if (!container || !regionsData) return;

//   container.innerHTML = '';

//   regionsData.regions.forEach(region => {
//     container.appendChild(createRegionElement(region));
//   });
// }
// Modify the createRegionElement function

// function createRegionElement(region) {
//   const regionItem = document.createElement('li');
//   regionItem.className = 'region-item w-100 ms-1 px-2';

//   regionItem.innerHTML = `
//     <div class="d-flex justify-content-between align-items-center region-clickable"
//          style="transition: background-color 0.2s; border-radius: 4px;">
//       <div class="d-flex align-items-center" style="width: 100%;">
//         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
//           <path d="M12 8.7225L13.08 11.2725L13.98 11.3475L15.8325 11.505L13.74 13.32L13.9425 14.205L14.3625 16.0125L12.7725 15.0525L12 14.5725L11.2275 15.0375L9.6375 15.9975L10.0575 14.19L10.26 13.305L8.1675 11.49L10.02 11.3325L10.92 11.2575L11.2725 10.425L12 8.7225ZM12 4.875L9.8925 9.8475L4.5 10.305L8.595 13.8525L7.365 19.125L12 16.3275L16.635 19.125L15.405 13.8525L19.5 10.305L14.1075 9.8475L12 4.875Z" fill="black" class="star-none" />
//         </svg>
//         <span class="region-name rounded ms-1 w-100 p-2 lh-base text-truncate" style="max-width: 260px; font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 16px; color: #212529; text-decoration: none; margin-left: 8px;">
//           ${region.name}
//         </span>
//       </div>
//       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
//         <path d="M12.6 12L8 7.4L9.4 6L15.4 12L9.4 18L8 16.6L12.6 12Z" fill="black" fill-opacity="0.2" />
//       </svg>
//     </div>
//   `;

//   const regionDiv = regionItem.querySelector('.region-clickable');

//   if (isMobile()) {
//     // Mobile behavior - show places in nested modal when clicked
//     regionDiv.addEventListener('click', function(e) {
//       e.preventDefault();

//       // Set modal title
//       document.getElementById('mobilePlacesModalLabel').textContent = region.name;

//       // Clear and populate places container
//       const mobilePlacesContainer = document.getElementById('mobile-places-container');
//       mobilePlacesContainer.innerHTML = '<ul class="list-unstyled" id="mobile-places-list"></ul>';

//       const mobilePlacesList = document.getElementById('mobile-places-list');
//       region.places.forEach(place => {
//         mobilePlacesList.appendChild(createPlaceElement(place));
//       });

//       // Show nested modal
//       const placesModal = new bootstrap.Modal(document.getElementById('mobilePlacesModal'), {
//         backdrop: 'static'
//       });
//       placesModal.show();
//     });

//     // Mobile hover effects
//     regionDiv.addEventListener('mouseenter', () => {
//       regionDiv.style.backgroundColor = '#f8f9fa';
//     });

//     regionDiv.addEventListener('mouseleave', () => {
//       regionDiv.style.backgroundColor = 'transparent';
//     });
//   } else {
//     // Desktop behavior - hover to show in right column
//     regionDiv.addEventListener('mouseenter', () => {
//       regionDiv.style.backgroundColor = '#f8f9fa';
//       showPlacesInRightColumn(region.places, region.name);
//     });

//     regionDiv.addEventListener('mouseleave', () => {
//       regionDiv.style.backgroundColor = 'transparent';
//     });
//   }

//   return regionItem;
// }
function createRegionElement(region) {
	const regionItem = document.createElement("li");
	regionItem.className = "region-item w-100 ms-1 px-2";

	regionItem.innerHTML = `
    <div class="d-flex justify-content-between align-items-center region-clickable"
         style="transition: background-color 0.2s; border-radius: 4px;">
      <div class="d-flex align-items-center" style="width: 100%;">
        <span class="region-name rounded ms-1 w-100 p-2 lh-base text-truncate" style="max-width: 260px; font-family: 'Roboto', sans-serif; font-weight: 400; font-size: 16px; color: #212529; text-decoration: none; margin-left: 8px;">
          ${region.name}
        </span>
      </div>
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12.6 12L8 7.4L9.4 6L15.4 12L9.4 18L8 16.6L12.6 12Z" fill="black" fill-opacity="0.2" />
      </svg>
    </div>
  `;

	const regionDiv = regionItem.querySelector(".region-clickable");

	if (isMobile()) {
		// Mobile behavior - show places in nested modal when clicked
		regionDiv.addEventListener("click", function (e) {
			e.preventDefault();
			// console.log('regionnnnnnnnnnnnnnnnn')
			// Set modal title
			document.getElementById("mobilePlacesModalLabel").textContent =
				region.name;

			// Clear and populate places container
			const mobilePlacesContainer = document.getElementById(
				"mobile-places-container"
			);
			mobilePlacesContainer.innerHTML =
				'<ul class="list-unstyled" id="mobile-places-list"></ul>';

			const mobilePlacesList = document.getElementById("mobile-places-list");
			region.places.forEach((place) => {
				mobilePlacesList.appendChild(createPlaceElement(place, null));
			});

			// Show nested modal
			const placesModal = new bootstrap.Modal(
				document.getElementById("mobilePlacesModal"),
				{
					backdrop: "static",
				}
			);
			placesModal.show();
		});
	} else {
		// Desktop behavior - hover to show in right column and click to select region
		regionDiv.addEventListener("mouseenter", () => {
			regionDiv.style.backgroundColor = "#f8f9fa";
			showPlacesInRightColumn(region.places, region.code);
			regionHover = region.code;
		});

		regionDiv.addEventListener("mouseleave", () => {
			regionDiv.style.backgroundColor = "transparent";
		});
	}

	// Common click handler for both mobile and desktop
	regionDiv.addEventListener("click", function (e) {
		if (!isMobile()) {
			e.preventDefault();
			highlightRegionOnMap(region.name);
			updateElectionResults("region", region.name);
			// console.log("regonnnnnnnnnnnnnn desktop")
		}
	});

	return regionItem;
}
function renderRegions(regionsData) {
	const container = document.getElementById("regions-container");
	if (!container || !regionsData) return;

	container.innerHTML = "";

	// For mobile, we might want to add a back button or different styling
	if (isMobile()) {
		container.classList.add("mobile-regions-list");
	}

	regionsData.regions.forEach((region) => {

		container.appendChild(createRegionElement(region));
	});
}

function setupDropdownToggle() {
	document.querySelectorAll(".item.w-100 > div").forEach((header) => {
		header.addEventListener("click", (e) => {
			e.preventDefault();
			const dropdown = e.currentTarget.nextElementSibling;
			dropdown.style.display =
				dropdown.style.display === "none" ? "block" : "none";
		});
	});
}

async function initRegionMenu() {
	const regions = await fetchRegions();
	if (regions) {
		renderRegions(regions);
		setupDropdownToggle();
	}
}


document.addEventListener("DOMContentLoaded", initRegionMenu);