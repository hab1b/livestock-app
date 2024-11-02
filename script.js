// script.js

let cows = []; // Array to hold cow data
let cowsMap = {}; // Map for quick lookup by ID

// Function to initialize the app
function init() {
  loadData();
  setupSearch();
  setupModal();
  setupViewToggle();
}

// Function to load data from CSV
function loadData() {
  fetch('data/cows.csv')
    .then(response => response.text())
    .then(csvText => {
      const parsed = Papa.parse(csvText, { header: true });
      cows = parsed.data.filter(cow => cow.ID); // Remove any empty rows
      // Create a map for easy lookup
      cows.forEach(cow => {
        cowsMap[cow.ID] = cow;
      });
      renderProfiles(cows);
    })
    .catch(error => console.error('Error loading CSV:', error));
}

// Function to render profiles
function renderProfiles(cowsArray) {
  const container = document.getElementById('profilesContainer');
  container.innerHTML = ''; // Clear existing profiles

  cowsArray.forEach(cow => {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.id = cow.ID;

    // Placeholder image - you can customize based on cow data
    const img = document.createElement('img');
    img.src = './assets/images/' + cow.ID + '.jpeg';
    img.alt = cow.Nombre;

    const cardContainer = document.createElement('div');
    cardContainer.className = 'container';

    const name = document.createElement('h4');
    name.textContent = cow.Nombre;

    const breed = document.createElement('p');
    breed.innerHTML = `<strong>Raza:</strong> ${cow.Raza || 'No especificado'}`;

    const breeder = document.createElement('p');
    breeder.innerHTML = `<strong>Criador:</strong> ${cow.Criador || 'No especificado'}`;

    cardContainer.appendChild(name);
    cardContainer.appendChild(breed);
    cardContainer.appendChild(breeder);
    card.appendChild(img);
    card.appendChild(cardContainer);

    // Add click event to open modal with detailed info
    card.addEventListener('click', () => openModal(cow.ID));

    container.appendChild(card);
  });
}

// Function to set up search functionality
function setupSearch() {
  const searchBar = document.getElementById('searchBar');
  searchBar.addEventListener('input', function(e) {
    const query = e.target.value.toLowerCase();
    const filteredCows = cows.filter(cow => 
      cow.Nombre.toLowerCase().includes(query) || cow.ID.includes(query)
    );
    renderProfiles(filteredCows);
  });
}

// Modal Elements
const modal = document.getElementById('profileModal');
const modalContent = document.getElementById('modalContent');
const closeButton = document.querySelector('.close-button');

// Function to set up modal behavior
function setupModal() {
  closeButton.addEventListener('click', closeModal);
  window.addEventListener('click', function(event) {
    if (event.target == modal) {
      closeModal();
    }
  });
}

// Function to open modal with cow details
function openModal(cowID) {
  const cow = cowsMap[cowID];
  if (!cow) return;

  // Clear previous content
  modalContent.innerHTML = '';

  // Add detailed information
  const name = document.createElement('h2');
  name.textContent = cow.Nombre;

  const detailsList = document.createElement('ul');
  detailsList.innerHTML = `
    <li><strong>ID:</strong> ${cow.ID}</li>
    <li><strong>Raza:</strong> ${cow.Raza || 'No especificado'}</li>
    <li><strong>Criador:</strong> ${cow.Criador || 'No especificado'}</li>
    <li><strong>Sexo:</strong> ${cow.Sexo || 'No especificado'}</li>
    <li><strong>Color:</strong> ${cow.Color || 'No especificado'}</li>
    <li><strong>Fecha de Nacimiento:</strong> ${cow['Fecha de Nacimiento'] || 'No especificado'}</li>
  `;

  // Genetic Tree Section
  const geneticTree = document.createElement('div');
  geneticTree.innerHTML = `<h3>Árbol Genético</h3>`;
  
  const treeList = document.createElement('ul');
  treeList.innerHTML = `
    <li><strong>Padre:</strong> ${cow['Nombre Padre'] || 'N/A'} (ID: ${cow.ID_Padre || 'N/A'})</li>
    <li><strong>Madre:</strong> ${cow['Nombre Madre'] || 'N/A'} (ID: ${cow.ID_Madre || 'N/A'})</li>
    <li><strong>Abuelos Paternos:</strong> ${cow['Abuelo Paterno'] || 'N/A'}, ${cow['Abuela Paterna'] || 'N/A'}</li>
    <li><strong>Abuelos Maternos:</strong> ${cow['Abuelo Materno'] || 'N/A'}, ${cow['Abuela Materna'] || 'N/A'}</li>
  `;

  geneticTree.appendChild(treeList);

  // Append all to modal content
  modalContent.appendChild(name);
  modalContent.appendChild(detailsList);
  modalContent.appendChild(geneticTree);

  // Show modal
  modal.style.display = 'block';
}

// Function to close modal
function closeModal() {
  modal.style.display = 'none';
}

// Function to set up view toggle
function setupViewToggle() {
  const viewToggle = document.getElementById('viewToggle');
  const toggleLabel = document.getElementById('toggleLabel');

  viewToggle.addEventListener('change', function(e) {
    if (e.target.checked) {
      // Switch to Genetic Tree View
      document.getElementById('profilesContainer').style.display = 'none';
      document.getElementById('treeContainer').style.display = 'block';
      toggleLabel.textContent = 'Genetic Tree View';
      renderGeneticTree();
    } else {
      // Switch to Card View
      document.getElementById('profilesContainer').style.display = 'flex';
      document.getElementById('treeContainer').style.display = 'none';
      toggleLabel.textContent = 'Card View';
    }
  });
}

// Function to process data into hierarchical structure
function buildHierarchy() {
  let idToNodeMap = {};
  let roots = [];

  // Initialize nodes
  cows.forEach(cow => {
    idToNodeMap[cow.ID] = {
      id: cow.ID,
      name: cow.Nombre,
      data: cow,
      children: []
    };
  });

  // Assign children to parents
  cows.forEach(cow => {
    let parentID = cow.ID_Padre || cow.ID_Madre;
    if (cow.ID_Padre && idToNodeMap[cow.ID_Padre]) {
      idToNodeMap[cow.ID_Padre].children.push(idToNodeMap[cow.ID]);
    } else if (cow.ID_Madre && idToNodeMap[cow.ID_Madre]) {
      idToNodeMap[cow.ID_Madre].children.push(idToNodeMap[cow.ID]);
    } else {
      // If no parent found, consider as root
      roots.push(idToNodeMap[cow.ID]);
    }
  });

  return { name: "Hacienda Toledo", children: roots };
}

// Function to render genetic tree using D3.js
function renderGeneticTree() {
  const treeData = buildHierarchy();

  // Clear previous tree if any
  d3.select("#treeContainer").selectAll("*").remove();

  // Set the dimensions and margins of the diagram
  const margin = {top: 20, right: 90, bottom: 30, left: 90},
        width = 1600 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

  // Append the svg object to the treeContainer
  const svg = d3.select("#treeContainer").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate("
            + margin.left + "," + margin.top + ")");

  const treemap = d3.tree().size([height, width]);

  let nodes = d3.hierarchy(treeData, d => d.children);

  nodes = treemap(nodes);

  // Links
  const link = svg.selectAll(".link")
      .data(nodes.descendants().slice(1))
    .enter().append("path")
      .attr("class", "link")
      .attr("d", d => {
         return "M" + d.y + "," + d.x
           + "C" + (d.parent.y + 100) + "," + d.x
           + " " + (d.parent.y + 100) + "," + d.parent.x
           + " " + d.parent.y + "," + d.parent.x;
         });

  // Nodes
  const node = svg.selectAll(".node")
      .data(nodes.descendants())
    .enter().append("g")
      .attr("class", d => 
        "node" + 
        (d.children ? " node--internal" : " node--leaf"))
      .attr("transform", d => "translate(" + d.y + "," + d.x + ")")
      .on("click", (event, d) => {
        if (d.data.id) {
          openModal(d.data.id);
        }
      });

  node.append("circle")
      .attr("r", 10);

  node.append("text")
      .attr("dy", ".35em")
      .attr("x", d => d.children ? -13 : 13)
      .style("text-anchor", d => d.children ? "end" : "start")
      .text(d => d.data.id);
}

// Initialize the app on page load
document.addEventListener('DOMContentLoaded', init);
