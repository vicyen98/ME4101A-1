console.log("Hello");
let inputData;
let extractedData = {};
let rescaledCoordinates = [];
let FV = [];
let FC = [];
const uploadButton = document.getElementById("upload");
const fileInput = document.getElementById("fileInput");
const testInput = document.getElementById("testInput");

uploadButton.addEventListener("click", () => {  // Add a click event listener to the button
  fileInput.click();  // Trigger the file input click event when the button is clicked
});
 
testInput.addEventListener("click",() => {
  console.log(inputData);
  console.log(extractedData);
  //console.log(rescaleCoordinates(extractedData.vertices_coords));
});

fileInput.addEventListener("change", (event) => { // Add an event listener to handle file selection
  const selectedFile = event.target.files[0];
  if (selectedFile) {
    const reader = new FileReader();
    console.log("Selected file: " + selectedFile.name);
    reader.onload = function (e) {
      const fileContent = e.target.result;
      try {
        const parsedData = JSON.parse(fileContent); // Parse the uploaded file content as JSON
        inputData = JSON.parse(JSON.stringify(parsedData));
        extractedData.vertices_coords = JSON.parse(JSON.stringify(inputData.vertices_coords));
        extractedData.edges_vertices = JSON.parse(JSON.stringify(inputData.edges_vertices));
        extractedData.edges_assignment = JSON.parse(JSON.stringify(inputData.edges_assignment));
        // to be elaborate using pure fucntion operation on previous data
        extractedData.faces_vertices = JSON.parse(JSON.stringify(inputData.faces_vertices));
        setup();
        } catch (error) {
        console.error("Error parsing the uploaded file as JSON:", error);
        }
      }
      reader.readAsText(selectedFile);
    }
  });

// const rescaleCoordinates = (vertices) => {
//   const minValues = [Infinity, Infinity, Infinity]; // Find the minimum and maximum values for each axis
//   const maxValues = [-Infinity, -Infinity, -Infinity];
//   vertices.forEach(coord => {
//       for (let i = 0; i < 3; i++) {
//           minValues[i] = Math.min(minValues[i], coord[i]);
//           maxValues[i] = Math.max(maxValues[i], coord[i]);
//       }
//   }); 
//   const maxRange = Math.max(  // Calculate the scaling factor to fit within [-1, 1] range
//       maxValues[0] - minValues[0],
//       maxValues[1] - minValues[1],
//       maxValues[2] - minValues[2]
//   );
//   const scale = maxRange !== 0 ? 1 / maxRange : 1;
//   const rescaledVertices = vertices.map(coord =>  // Rescale the coordinates
//       coord.map(value => value * scale)
//   );
//   return rescaledVertices;
// };

const substituteIndexes = (coordinates, indexArray) => {
  return indexArray.map(indices => indices.map(index => coordinates[index]));
};

const generateSurfaceColors = (numSurfaces) => {
  const getRandomHex = () => Math.floor(Math.random() * 256);
  const colors = [];
  for (let i = 0; i < numSurfaces; i++) {
      let color = (getRandomHex() << 16) | (getRandomHex() << 8) | getRandomHex();
      while ( // Ensure the color is different from the previous one
          i > 0 &&
          color === colors[i - 1]
      ) {
          color = (getRandomHex() << 16) | (getRandomHex() << 8) | getRandomHex();
      }
      colors.push(color);
  }
  return colors;
};


import * as THREE from 'three';

const setup = () => {
  document.body.style.margin = 0;
  document.body.style.padding = 0;
  const [w, h] = [window.innerWidth, window.innerHeight];
  const scene = new THREE.Scene();
  const s = 3;
  const camera = new THREE.OrthographicCamera(-s, s, s*h/w, -s*h/w, 0, 2*s);
  camera.position.z = s;
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(w, h);
  renderer.setClearColor(0xeeeeee);
  document.body.appendChild(renderer.domElement);

  let mouse = undefined;
  let change = undefined;

  // rescaledCoordinates = rescaleCoordinates(extractedData.vertices_coords);
  // FV = substituteIndexes(rescaledCoordinates, extractedData.faces_vertices);
  FV = substituteIndexes(extractedData.vertices_coords, extractedData.faces_vertices);
  FC = generateSurfaceColors(FV.length);
  console.log(FV);
  console.log(FC);
  const update = () => {
      while (scene.children.length > 0) {
          scene.remove(scene.children[0]);
      }
      if (change != undefined) {
          const [dx, dy] = change.map(a => a*Math.PI/180);
          const rotation = new THREE.Quaternion()
              .setFromEuler(new THREE.Euler(dy, dx, 0, 'XYZ'));
          scene.quaternion.multiplyQuaternions(rotation, scene.quaternion);
      }
      for (let i = 0; i < FV.length; ++i) {
          const [P, color] = [FV[i], FC[i]];
          // Convert vertices to Float32Array
          const vertices = new Float32Array(P.flat());

          // Create a BufferGeometry
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

          // Define indices for the shape (triangle fan)
          const indices = [];
          for (let i = 1; i <= P.length - 2; i++) {
              indices.push(0, i, i + 1);
          }

          geometry.setIndex(indices);

          // Create a material with the specified color
          const material = new THREE.MeshBasicMaterial({ color , transparent: true, opacity: 0.5});

          // Create a mesh using the geometry and material
          const mesh = new THREE.Mesh(geometry, material);
          scene.add(mesh);
      }
      renderer.render(scene, camera);
  };

  renderer.domElement.onmousedown = (e) => {
      mouse = [e.offsetX, e.offsetY];
      update();
  };

  renderer.domElement.onmouseup = (e) => {
      mouse = undefined;
      update();
  };

  renderer.domElement.onmousemove = (e) => {
      if (mouse == undefined) { return; }
      change = [e.offsetX - mouse[0], e.offsetY - mouse[1]];
      mouse = [e.offsetX, e.offsetY];
      update();
  };
  update();
};
