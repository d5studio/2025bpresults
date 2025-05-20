// const API_BASE_URL = "https://prod-bilangpilipino2025.s3.ap-southeast-1.amazonaws.com/";
const API_BASE_URL = `./assets/BP2025/json_data/main/`;
// const API_BASE_URL = BASE_URL + "bilangpilipino/count/getApi/get?api=";
// const API_BASE_URL = "https://data.bilangpilipino.com/";
const DEFAULT_DISPLAY_COUNT = 24;
const IMAGE_PATH = `./assets/images/BP2025/count/user.png`;

const listSet = new Set(["senators", "partylists", "localRace"]);

// Data Stores
const electionData = {
  senators: [],
  partylists: [],
  localRace: [],
  listStatus: [true, false, false],
  timeStampData: [0, 0, 0],
  // percentage: [],
  filter: "philippines"
};

// Main Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // await updateSenatorPartyListData();
  // await initializeElectionResults();
  // await updateTimestampData("summary/nationals.json", 0);
});

// Core Functions
async function initializeElectionResults() {
  try {
    await updateSenatorPartyListData();
    await Promise.all([
      fetchAndDisplayData('senators', (data) => displaySenatorialData(data, Infinity), electionData.senators),
      fetchAndDisplayData('partylists', (data) => displayPartylistData(data, Infinity), electionData.partylists)
    ]);
  } catch (error) {
    console.error('Initialization error:', error);
    displayError();
  }
  debugger;
}

async function fetchAndDisplayData(dataType, displayFunction, electionData = {}) {
  try {
    const [data, staticData] = await Promise.all([
      electionData,
      // fetchData(`${BASE_URL}/assets/bp-2025-elections-1/data/static-color-per-candidate.json`) // Replace with actual static.json path
    ]);

    // Merge data with static.json
    const mergedData = data.map(candidate => {
      const staticCandidate = staticData.find(
        item => item.CANDIDATE_NAME === candidate.CANDIDATE_NAME
      );

      return {
        ...candidate,
        IMAGE_PATH: staticCandidate
          ?
          `./assets/senator-images/REVILLAME-WILLIE-WIL-(IND).jpg`
          // `${BASE_URL}/assets/BP2025/assets/senator-images/${staticCandidate.IMAGE_FILENAME}`
          : IMAGE_PATH, // Fallback to default image
        HEX_CODE: staticCandidate ? staticCandidate.HEX_CODE : '#ccc' // Fallback to default color
      };
    });

    electionData[dataType] = mergedData;
    displayFunction(mergedData);

    if (dataType === 'senators') {
      // initSearch();
    }
  } catch (error) {
    console.error(`Error loading ${dataType} data:`, error);
    displayError(`#${dataType === 'senators' ? 'senators' : 'party-list'} .container-participants`);
  }
}
// Update initialization flow
// document.addEventListener('DOMContentLoaded', async () => {
//   await Promise.all([
//     fetchAndDisplayData('senators', displaySenatorialData),
//     fetchAndDisplayData('partylists', displayPartylistData)
//   ]);
//   await updateTimestampData("summary/nationals.json", 0);
// });

async function fetchData(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Network response not ok: ${response.status}`);
  }
  return response.json();
}

let staticCandidate = [];
async function fetchStaticCandidate() {
  // let staticCan = await fetch(`http://localhost/bp-2025-elections-1/assets/BP2025/data/static-color-per-candidate.json`);
  let staticCan = await fetch(`./assets/json/static-color-per-candidate.json`);

  staticCan = await staticCan.json();
  staticCandidate = staticCan;
  // citySenatoriablesData = staticCan

}
document.addEventListener('DOMContentLoaded', () => {
  (async function () {
    await fetchStaticCandidate();
  })()

  const tabLinks = document.querySelectorAll('.nav-link.tab-title');

  tabLinks.forEach(link => {
    link.addEventListener('shown.bs.tab', async function (event) {
      const targetTab = event.target; // The newly activated tab
      const tabType = targetTab.getAttribute('data-type'); // Custom attribute, like "senators", "localrace", etc.



      switch (tabType) {
        case "localrace":
          break;
        case "partylists":
          break;
        default:
        // let { results } = await queryData();
        // displaySenatorialData(results?.senatorial)
      }
    });
  });
})

async function generateCandidateHTML(candidates, totalVotes, type, maxCount = DEFAULT_DISPLAY_COUNT) {
  const container = getContainerElement(type === 'senators' ? 'senators' : 'party-list');
  let html = '';

  const displayCandidates = maxCount !== Infinity ?
    candidates.slice(0, maxCount) :
    candidates;

  displayCandidates.forEach(async (candidate, index) => {
    const rank = index + 1;
    const isPartylist = type === 'party-list';
    const percentage = isPartylist ? (candidate.TOTAL_VOTES / totalVotes) * 100 : 0;
    const formattedPercentage = percentage.toFixed(2);
    const roundedPercentage = Math.round(percentage);
    const party = candidate.PARTY || candidate.PARTY_NAME || '';

    // const senator_image = staticCandidate?.find((item) => item.CANDIDATE_NAME === candidate.CANDIDATE_NAME)?.IMAGE_PATH || IMAGE_PATH;

    const hex_code = staticCandidate?.find((item) => item.CANDIDATE_NAME === candidate.CANDIDATE_NAME)?.HEX_CODE || '#fff';
    const candidateData = staticCandidate?.find((item) => item.CANDIDATE_NAME === candidate.CANDIDATE_NAME);

    html += `
      <div class="d-flex align-items-center justify-content-between w-100 pe-3" style="border-left: 4px solid ${hex_code}; padding-left: 10px;">
        <div class="d-flex align-items-end">
          ${!isPartylist ? `
          <div class="position-relative me-0" style="min-width: 44px; height: 44px; border-radius: 50%; overflow: hidden; background-color: #f0f0f0;">
            <img src="./assets/images/senator-images/${candidateData?.IMAGE_FILENAME}" 
                 class="position-absolute w-100 h-100" 
                 style="object-fit: cover;" 
                 alt="${candidate?.CANDIDATE_NAME}"
                 onerror="this.src='${IMAGE_PATH}'">
          </div>
          ` : ''}
          <h4 class="rank mb-0 me-3" style="color: #686868;">${String(rank).padStart(2, '')}</h4>
        </div>

        <div class="d-flex align-items-center justify-content-between w-100">
          <div class="d-flex flex-column text-dark">
            ${candidate?.CANDIDATE_NAME}
          </div>
          <div class="d-flex">
            ${isPartylist ? `
              <div class="d-flex flex-column me-2">
                <i class="text-end">${candidate?.TOTAL_VOTES.toLocaleString()}</i>
                <i class="text-end d-none">
                  ${formattedPercentage}%
                  <span class="d-none d-lg-inline">Votes</span>
                </i>
              </div>
              <div class="circular-progress d-none" 
                data-inner-circle-color="white" 
                data-percentage="${roundedPercentage}" 
                data-progress-color="rgba(234, 44, 47, 1)" 
                data-bg-color="rgba(234, 44, 47, 0.16)">
                <div class="inner-circle"></div>
                <p class="percentage d-none">0%</p>
              </div>
            ` : `
              <i>${candidate?.TOTAL_VOTES.toLocaleString()}</i>
            `}
          </div>
        </div>
      </div>
    `;
  });

  if (container) {
    container.innerHTML = html;
  }

  if (type === 'party-list') {
    initializeCircularProgressBars();
  }
}

function generateLocalRaceHTML(data, type = "province") {
  // Get the container element
  const container = document.querySelector('.local-race-content');
  let html = '';

  // Process each race type
  const processRaceType = (candidates, title, totalVotes) => {
    if (!candidates || candidates.length === 0) return '';

    let sectionHtml = `
      <div class="pt-2 px-2">
        <div class="d-flex flex-row justify-content-between">
          <h3 class="sub text-uppercase">${title.replace('_', ' ')}</h3>
          
        </div>
      </div>
      <div class="d-flex mt-3 flex-column gap-3 container-participants">
    `;

    // Calculate total votes if not provided
    if (!totalVotes) {
      totalVotes = candidates.reduce((sum, candidate) => sum + candidate.TOTAL_VOTES, 0);
    }

    candidates.forEach((candidate, index) => {
      // Extract party from candidate name (assuming format "LAST, FIRST (PARTY)")
      let party = '';
      let candidateName = candidate.CANDIDATE_NAME;
      const partyMatch = candidate.CANDIDATE_NAME.match(/\(([^)]+)\)/);
      const rank = index + 1;


      if (partyMatch) {
        party = partyMatch[1];
        candidateName = candidate.CANDIDATE_NAME.replace(`(${party})`, '').trim();
      }

      const percentage = totalVotes > 0 ? (candidate.TOTAL_VOTES / totalVotes) * 100 : 0;
      const formattedPercentage = percentage.toFixed(2);
      const roundedPercentage = Math.round(percentage);

      sectionHtml += `
  <div class="d-flex justify-content-between w-100 pe-3">
                  <div class="position-relative ms-3 me-0" style="min-width:16x; height: 36px; overflow: hidden;">

                          <div class="d-flex align-items-end">


          <h4 class="rank mb-0 me-3" style="color: #686868;">${String(rank).padStart(2, '')}</h4>
          </div>
          </div>
          <div class="d-flex justify-content-between w-100">
            <div class="d-flex flex-column">
              ${candidateName}
           
  ${candidateName}
</div>
            <div class="d-flex">
              <div class="d-flex flex-column me-2">
              <i class="text-end text-light-gray2">${candidate.TOTAL_VOTES.toLocaleString()}</i>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    sectionHtml += `</div>`;
    return sectionHtml;
  };

  const hierarchy = [
    "PROVINCIAL GOVERNOR",
    "PROVINCIAL VICE-GOVERNOR",
    "MEMBER, HOUSE OF REPRESENTATIVES",
    "MEMBER, SANGGUNIANG PANLALAWIGAN",
    "MAYOR",
    "VICE-MAYOR",
    "MEMBER, SANGGUNIANG BAYAN"
  ]

  const contest = Object.keys(data)
  const sortedContest = contest.sort((a, b) => {
    const getRank = (label) => {
      const clean = label.split(" OF")[0].trim();
      const match = hierarchy.find(h => clean.startsWith(h));
      return hierarchy.indexOf(match);
    };

    return getRank(a) - getRank(b);
  });

  // Generate HTML for each race type
  for (const contestName of sortedContest) {
    if (!["SENATOR OF PHILIPPINES", "PARTY LIST OF PHILIPPINES"].includes(contestName)) {
      html += processRaceType(data[contestName], contestName)
    }
  }

  // Update the container
  container.innerHTML = html;

  // Initialize circular progress bars
  initializeCircularProgressBars();
}

// Utility function to debounce rapid events
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
// Helper Functions
function getContainerElement(type) {
  return document.querySelector(`#${type} .container-participants`);
}

function validateData(data, container) {
  if (!data || data.length === 0) {
    container.innerHTML = '<div class="alert alert-warning">No data available</div>';
    return false;
  }
  return true;
}

function sortByRank(candidates) {
  return candidates.sort((a, b) => a.rank - b.rank);
}

function calculateTotalVotes(candidates) {
  return candidates.reduce((sum, candidate) => sum + (candidate.votes || candidate.votes || 0), 0);
}

function displayError(selector = '.container-participants') {
  const container = document.querySelector(selector);
  if (container) {
    container.innerHTML = '<div class="alert alert-danger">Error loading election data. Please try again later.</div>';
  }
}

function initializeCircularProgressBars() {
  const circularProgress = document.querySelectorAll(".circular-progress");

  Array.from(circularProgress).forEach((progressBar) => {
    const progressValue = progressBar.querySelector(".percentage");
    const innerCircle = progressBar.querySelector(".inner-circle");
    const endValue = Number(progressBar.getAttribute("data-percentage"));
    const progressColor = progressBar.getAttribute("data-progress-color");
    const bgColor = progressBar.getAttribute("data-bg-color");

    // Set the initial state
    progressValue.textContent = `${endValue}%`;
    progressValue.style.color = progressColor;
    innerCircle.style.backgroundColor = progressBar.getAttribute("data-inner-circle-color");
    progressBar.style.background = `conic-gradient(${progressColor} ${endValue * 3.6}deg, ${bgColor} 0deg)`;
  });
}

// Search Functionality
function initSearch() {
  // Initialize senator search
  const senatorSearchInput = document.querySelector('.input-search-senators');
  senatorSearchInput?.addEventListener('input', debounce((e) => {
    filterCandidates(e.target.value.toLowerCase(), 'senators');
  }, 300));

  // Initialize party-list search
  const partylistSearchInput = document.querySelector('.input-search-partylist');
  partylistSearchInput?.addEventListener('input', debounce((e) => {
    filterCandidates(e.target.value.toLowerCase(), 'partylists');
  }, 300));
}

function filterCandidates(searchTerm, type) {
  const container = getContainerElement(type === 'senators' ? 'senators' : 'party-list');

  if (container.filterTimeout) {
    clearTimeout(container.filterTimeout);
  }

  container.filterTimeout = setTimeout(() => {
    if (searchTerm.trim() === '') {
      // Reset to original state - show all candidates
      const candidates = electionData[type];
      const totalVotes = calculateTotalVotes(candidates);
      generateCandidateHTML(candidates, totalVotes, type, Infinity);
      return;
    }

    const filteredCandidates = searchCandidates(searchTerm, type);
    displayFilteredResults(filteredCandidates, container, type);
  }, 200);
}

function searchCandidates(searchTerm, type) {
  return electionData[type].filter(candidate => {
    // Case-insensitive search on candidate name
    const nameMatch = candidate.CANDIDATE_NAME.toLowerCase().includes(searchTerm);

    // If party-list, also search by party name if it exists
    if (type === 'partylists' && candidate.party) {
      return nameMatch || candidate.party.toLowerCase().includes(searchTerm);
    }

    return nameMatch;
  });
}

function displayFilteredResults(filteredCandidates, container, type) {
  if (filteredCandidates.length > 0) {
    const totalVotes = calculateTotalVotes(filteredCandidates);
    generateCandidateHTML(filteredCandidates, totalVotes, type, Infinity);
  } else {
    container.innerHTML = '<div class="alert alert-warning">No matching candidates found</div>';
  }
}

function resetToDefaultView(type) {
  const candidates = electionData[type];
  const totalVotes = calculateTotalVotes(candidates);
  generateCandidateHTML(candidates, totalVotes, type, Infinity);
}

// Fetch Api Data
const fetchApiNew = async (url) => {
  url = API_BASE_URL + url;
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json(); // assuming the server returns JSON
    return data;
  } catch (error) {
    console.error('Fetch error:', error);
  }
};
// Update Senator Data
const updateSenatorData = async (url = "summary/nationals.json") => {
  const response = await fetchApiNew(url);
  electionData.senators = response.results.senatorial;
};

// Update Party List Data
const updatePartyListData = async (url = "summary/nationals.json") => {
  const response = await fetchApiNew(url);
  electionData.partylists = response.results.partyList;
};

// Update Local Race Data
const updateLocalRaceData = async (url) => {
  const response = await fetchApiNew(url);
  electionData.localRace = response.results.senatorial;
};


// Update Senator & Partylist Data
const updateSenatorPartyListData = async (url = "summary/nationals.json") => {
  const response = await fetchApiNew(url);
  electionData.senators = response.results?.senatorial || [];
  electionData.partylists = response.results?.partyList || [];

};



function updateTimestampDisplay(timestamp, status = 200) {
  const timestampElements = document.querySelectorAll('.election-timestamp');
  timestampElements.forEach((element) => {
    element.innerHTML = timestamp
  })
}
function updatePercentageDisplay(percentage) {
  const percentageElement = document.querySelector('.election-percentage');

  if (percentageElement) {
    percentageElement.textContent = `${percentage}%`;
  }
  const progressBar = document.querySelector('.election-percentage-progress-bar');
  if (progressBar) {
    progressBar.style.width = `${percentage}%`;
  }
}

// Update List Status
const updateListStatus = (index) => {
  electionData.listStatus.fill(false);
  electionData.listStatus[index] = true;
}

// Updated the displayed Timestamp
const updateListAndMap = async (url) => {
  const index = electionData.listStatus.indexOf(true);
  const type = Array.from(listSet)[index];

  const response = await fetchApiNew(url);
  electionData[type] = await response.results[type];
  updateTimestampData(url, index);

  if (type == "senators") {
    fetchAndDisplayData(type, (data) => displaySenatorialData(data, Infinity), electionData[type])
  } else if (type == "partylists") {
    fetchAndDisplayData(type, (data) => displayPartylistData(data, Infinity), electionData[type])
  } else {
    // fetchAndDisplayData(type, (data) => displayPartylistData(data, Infinity), electionData[type])
  }
};

// Nav Tab Items
const tabs = document.querySelectorAll("li.nav-item>*[data-type]");
tabs.forEach(tab => {
  tab.addEventListener("click", async (e) => {
    const type = tab.dataset.type;
    switch (type) {
      case "senators":
        // await updateSenatorData();
        // fetchAndDisplayData(type, (data) => displaySenatorialData(data, Infinity), electionData[type])
        // updateTimestampData("summary/nationals.json", 0);
        break;
      case "partylists":
        // await updatePartyListData();
        // fetchAndDisplayData(type, (data) => displayPartylistData(data, Infinity), electionData[type])
        // updateTimestampData("summary/nationals.json", 1);
        break;
      case "localrace":
        // await updateLocalRaceData();
        // updateTimestampData("summary/nationals.json", 2);
        // fetchAndDisplayData(type, (data) => displayPartylistData(data, Infinity), electionData[type])
        break;
      default:
        break;
    }
  });
});


// const formatTimestamp = (input) => {
//   const [datePart, timePart] = input.split(':', 2);
//   const timeOnly = input.slice(input.indexOf(':') + 1);

//   const [day, month, year] = datePart.split('-');
//   const [hour, minute, second] = timeOnly.split(':');

//   const date = new Date(`${year}-${day}-${month}T${hour}:${minute}:${second}`);

//   const time = date.toLocaleTimeString('en-US', { 
//     hour: 'numeric', 
//     minute: '2-digit', 
//     hour12: false 
//   });

//   const formattedDate = date.toLocaleDateString('en-US', {
//     month: 'long',
//     day: 'numeric',
//     year: 'numeric'
//   });

//   return `${time}, ${formattedDate}`;
// };

// Format Path whitespace with underscore and Uppercase to Lowercase
const formatPath = input => {
  input = input.trim();
  input = input.toLowerCase();
  input = input.replaceAll(/\s+/g, "_");
  return input;
};



