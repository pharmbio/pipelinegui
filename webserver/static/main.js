/*
  Javascript version: ECMAScript 6 (Javascript 6)
 */

function createEmptyTable(size) {
  let rows;
  let cols;
  if(size == 96){
    rows = 8;
    cols = 12;
  }else if( size == 384){
    rows = 16;
    cols = 24;
  }

  let table = document.createElement('table');
  table.id = 'plateTable';
  table.className = 'plateTable';

  // First add header row
  let headerRow = document.createElement('tr');
  for (let col = 0; col < cols; col++) {
    // If first col then add empty cell before (to match column headers)
    if (col === 0) {
      let empty_cell = document.createElement('td');
      empty_cell.innerHTML = "";
      empty_cell.className = 'headerCell';
      headerRow.appendChild(empty_cell);
    }
    let row = 0;
    let well_name = getWellName(row, col);
    let header_cell = document.createElement('td');
    header_cell.innerHTML = well_name.substring(1);
    header_cell.className = 'headerCell';
    headerRow.appendChild(header_cell);
  }
  table.appendChild(headerRow);

  // Now add rows and columns
  for (let row = 0; row < rows; row++) {
    let rowElement = document.createElement('tr');
    for (let col = 0; col < cols; col++) {

      let well_name = getWellName(row, col);

      // Add column header before first column cell
      if (col === 0) {
        let header_cell = document.createElement('td');
        header_cell.innerHTML = well_name.charAt(0);
        header_cell.className = 'headerCell';
        rowElement.appendChild(header_cell);
      }

      let well_cell = document.createElement('td');
      well_cell.id = well_name;
      well_cell.className = 'wellCell';
      rowElement.appendChild(well_cell);
    }
    table.appendChild(rowElement);
  }

  return table;
}

class WellOrder {

  constructor(size, pattern){
    this.wellOrder = new Array();
    if(pattern === "SPIRAL"){
      this.wellOrder = this.generateSpiralOrder(size, this.wellOrder);
    }
  }

  getOrderArray(){
    return this.wellOrder;
  }

  generateSpiralOrder(size, wellOrder){
    let wells = Plate.createWellArray(size);
    let counter = { "value": 0 };
    this.floodFillRight(0, 0, wells, wellOrder, counter);
    return wellOrder;
  }

  floodFillRight(pos_x, pos_y, plate, wellOrder, counter) {

    if (this.isOutOfBounds(pos_x, pos_y, plate) || this.isDoneAlready(pos_x, pos_y, plate)) {
      return;
    }

    plate[pos_x][pos_y] = counter.value; // mark the point so that I know if I passed through it. 
    wellOrder.push("" + getWellName(pos_x, pos_y));
    counter.value++;

    this.floodFillUp(pos_x - 1, pos_y, plate, wellOrder, counter);
    this.floodFillRight(pos_x, pos_y + 1, plate, wellOrder, counter);
    this.floodFillDown(pos_x + 1, pos_y, plate, wellOrder, counter);
    this.floodFillLeft(pos_x, pos_y - 1, plate, wellOrder, counter);

    return;
  }

  floodFillUp(pos_x, pos_y, plate, wellOrder, counter) {

    if (this.isOutOfBounds(pos_x, pos_y, plate) || this.isDoneAlready(pos_x, pos_y, plate)) {
      return;
    }

    plate[pos_x][pos_y] = counter.value; // mark the point so that I know if I passed through it. 
    wellOrder.push("" + getWellName(pos_x, pos_y));
    counter.value++;

    this.floodFillLeft(pos_x, pos_y - 1, plate, wellOrder, counter);
    this.floodFillUp(pos_x - 1, pos_y, plate, wellOrder, counter);
    this.floodFillRight(pos_x, pos_y + 1, plate, wellOrder, counter);
    this.floodFillDown(pos_x + 1, pos_y, plate, wellOrder, counter);

    return;
  }

  floodFillDown(pos_x, pos_y, plate, wellOrder, counter) {

    if (this.isOutOfBounds(pos_x, pos_y, plate) || this.isDoneAlready(pos_x, pos_y, plate)) {
      return;
    }

    plate[pos_x][pos_y] = counter.value; // mark the point so that I know if I passed through it. 
    wellOrder.push("" + getWellName(pos_x, pos_y));
    counter.value++;

    this.floodFillRight(pos_x, pos_y + 1, plate, wellOrder, counter);
    this.floodFillDown(pos_x + 1, pos_y, plate, wellOrder, counter);
    this.floodFillLeft(pos_x, pos_y - 1, plate, wellOrder, counter);
    this.floodFillUp(pos_x - 1, pos_y, plate, wellOrder, counter);

    return;
  }

  floodFillLeft(pos_x, pos_y, plate, wellOrder, counter) {

    if (this.isOutOfBounds(pos_x, pos_y, plate) || this.isDoneAlready(pos_x, pos_y, plate)) {
      return;
    }

    plate[pos_x][pos_y] = counter.value; // mark the point so that I know if I passed through it. 
    wellOrder.push("" + getWellName(pos_x, pos_y));
    counter.value++;

    this.floodFillDown(pos_x + 1, pos_y, plate, wellOrder, counter);
    this.floodFillLeft(pos_x, pos_y - 1, plate, wellOrder, counter);
    this.floodFillUp(pos_x - 1, pos_y, plate, wellOrder, counter);
    this.floodFillRight(pos_x, pos_y + 1, plate, wellOrder, counter);

    return;
  }

  isOutOfBounds(pos_x, pos_y, plate) {
    // out of bounds
    if (pos_x < 0 || pos_x >= plate.length) {
      return true;
    }
    // out of bounds
    if (pos_y < 0 || pos_y >= plate[pos_x].length) {
      return true;
    }
    return false;
  }

  isDoneAlready(pos_x, pos_y, plate) {
    // been here already
    if (plate[pos_x][pos_y] != undefined) {
      return true;
    }
    return false;
  }
}


class Plate {
  constructor(size) {
    this.size = size;
    this.wells = Plate.createWellArray(size);
    this.wellOrder = new WellOrder(size, "SPIRAL").getOrderArray();
  }

  static createWellArray(size) {
    let nRows;
    let nCols;

    if (size == 96) {
      nRows = 8;
      nCols = 12;
    } else if (size == 384) {
      nRows = 16;
      nCols = 24;
    } else {
      throw "Not a valid plate size: " + size;
    }

    let wells = new Array(nRows)
    for (let row = 0; row < nRows; row++) {
      wells[row] = new Array(nCols);
    }
    return wells;
  }

}

// 0,0 equals A1
function getWellName(row, col) {
  let rows = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
  return rows[row] + (col + 1).toString().padStart(2, 0)
}

function getRowIndexFrowWellName(name) {
  let ascVal = name.charCodeAt(0);
  // A = char code 65
  let rowIndex = ascVal - 64;
  return rowIndex;
}

function getColIndexFrowWellName(name) {
  let colIndex = parseInt(name.substr(1), 10);
  return colIndex;
}


var _loaded_protocols = null;

function setProtocols(protocols) {
  _loaded_protocols = protocols;
}

function getProtocols() {
  return _loaded_protocols;
}

class Protocols {
  constructor(protocols_json) {
    this.protocols = new Array();
    for (let protocol_json of protocols_json) {
      this.protocols.push(new Protocol(protocol_json));
    }
  }

  getProtocolFromName(name) {
    // Loop until name is fount, then return protocol-object
    for (let protocol of this.protocols) {
      console.log("name", name);
      console.log("protocol.getName()", protocol.getName());
      if (name === protocol.getName()) {
        console.log("String match");
        return protocol;
      }
    }
  }

  getArray() {
    return this.protocols;
  }

}

class Protocol {
  constructor(jsondata) {
    this.json = jsondata;
  }

  getName() {
    return this.json.name;
  }

  getStepsAsText() {
    let stepsText = "";
    //return JSON.stringify(this.json.steps, undefined, 2);

    stepsText += "[\n";
    for (let step of this.json.steps) {
      console.log("step", step);
      stepsText += JSON.stringify(step) + ",\n";
      //stepsText += step.toString() + "\n";
    }
    stepsText = stepsText.substring(0, stepsText.length - 2);
    stepsText += "\n]";

    return stepsText;
  }

}

let protocol1_json = {
  name: "Standard_1",
  steps: [
    { name: "wash", protocol: "wash-40uL" },
    { name: "disp", protocol: "disp-40uL-mito" },
    { name: "incu_co2", time: "20" },
    { name: "wash", protocol: "wash-3x-70uL-dye" },
    { name: "disp", protocol: "disp-70uL-PFE" },
    { name: "incu_room", time: "20" },
    { name: "wash", protocol: "wash-40uL" },
    { name: "disp", protocol: "disp-70uL-triton" },
    { name: "shake", time: "17" },
    { name: "wash", protocol: "wash-40uL" },
    { name: "disp", protocol: "disp-50uL-color-cocktail" },
    { name: "incu_room", time: "20" },
    { name: "wash", protocol: "wash-3x-80uL-dye" },
    { name: "cool", time: "forever" }
  ]
};

let protocol2_json = {
  name: "Standard_2",
  steps: [
    { name: "wash", protocol: "wash-20uL" },
    { name: "disp", protocol: "disp-20uL-mito" },
    { name: "incu_co2", time: "20" },
    { name: "wash", protocol: "wash-3x-70uL-dye" },
    { name: "disp", protocol: "disp-70uL-PFE" },
    { name: "incu_room", time: "20" },
    { name: "wash", protocol: "wash-20uL" },
    { name: "disp", protocol: "disp-70uL-triton" },
    { name: "shake", time: "17" },
    { name: "wash", protocol: "wash-20uL" },
    { name: "disp", protocol: "disp-50uL-color-cocktail" },
    { name: "incu_room", time: "20" },
    { name: "wash", protocol: "wash-3x-80uL-dye" },
    { name: "cool", time: "forever" }
  ]
};

function updateProtocolSelect(selected = "") {

  // This select is not available on all pages, return if not
  let elemSelect = document.getElementById('protocol-select');
  if (elemSelect == null) {
    return;
  }

  // reset
  elemSelect.options.length = 0;
  elemSelect.options.selectedIndex = -1;

  // Just loop all protocols
  let protocols = getProtocols().getArray();
  protocols.forEach(function (protocol, index) {
    console.log("protocol", protocol)
    elemSelect.options.add(new Option(protocol.getName()));
    // Maybe select option
    if (selected === protocol.getName()) {
      elemSelect.options.selectedIndex = index;
    }
  });
}

function setProtocolSelection(protocol) {
  let elemSelect = document.getElementById('protocol-select');
  elemSelect.selectedIndex = getSelectIndexFromSelectValue(elemSelect, protocol);
}

function redrawSelectedProtocol() {
  let elem = document.getElementById('protocol-select');
  let protocolName = elem.options[elem.selectedIndex].value;
  console.log("protocolName", protocolName);
  console.log("protocols", getProtocols());
  let protocol = getProtocols().getProtocolFromName(protocolName);
  document.getElementById('plate-protocol-steps').value = protocol.getStepsAsText();

  // Update save and save as, delete .. text fields
  document.getElementById('save-protocol-name').value = protocolName;
  document.getElementById('delete-protocol-name').value = protocolName;
}

function reloadProtocolsUI(selected = "") {
  apiLoadProtocols(selected);
}

function initProtocolsUI() {
  apiLoadProtocols();
}

function updateProtocolsUI(selected = "") {
  updateProtocolSelect(selected);
  redrawSelectedProtocol();
}

function apiLoadProtocols(selected = "") {

  //var toSelect = selected;

  fetch('/api/protocols/all')
    .then(response => response.json())
    .then(data => {

      console.log('protocols data', data);

      setProtocols(new Protocols(data.result));

      console.log(getProtocols());

      console.log("Protocols loaded");
      updateProtocolsUI(selected);

    })
    .catch(error => {
      console.error('Error:', error);
    })
}

function getProtocolStepsAsJson() {
  text = document.getElementById('plate-protocol-steps').value;
  lineArray = text.split("\n");
  stepsArray = new Array();

  try {
    for (let line of lineArray) {
      console.log(line);
      if (line.length > 0) {
        stepsArray.push(JSON.parse(line));
      }
    }
    console.log("stepsArray", stepsArray);

    return stepsArray

  } catch (err) {
    displayModalError(err);
    return false;
  }
}

function verifyProtocolStepsJson(displayOKResult) {
  text = document.getElementById('plate-protocol-steps').value;
  JSON.parse(text);
  if (displayOKResult === true) {
    showOKModal("JSON Verified OK");
  }
}

function apiSaveProtocol() {
  // verify
  verifyProtocolStepsJson(false);

  let newName = document.getElementById('save-protocol-name').value;

  let formData = new FormData(document.getElementById('main-form'));
  formData.append("new_name", newName);

  fetch('/api/protocol/save', {
    method: 'POST',
    body: formData
    })
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          reloadProtocolsUI(newName);
          $("#save-protocol-modal").modal('hide');
          showOKModal("Protocol Saved");

        });
      }
      else {
        response.text().then(function (text) {
          displayModalServerError(response.status, text);
        });
      }

    })
    .catch(function (error) {
      console.log(error);
      displayModalError(error);
    });
}

function apiDeleteProtocol() {

  let deleteName = document.getElementById('delete-protocol-name').value;
  let deleteURL = "/api/protocol/delete/" + deleteName;

  fetch(deleteURL)
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          reloadProtocolsUI();
          $("#delete-protocol-modal").modal('hide');
          showOKModal("Protocol Deleted");

        });
      }
      else {
        response.text().then(function (text) {
          displayModalServerError(response.status, text);
        });
      }

    })
    .catch(function (error) {
      console.log("err", error);
      displayModalError(error);
    });
}

function displayModalServerError(status, text) {
  displayModalError("Server error: " + status + ", Response: " + text);
}

function displayModalJavaScriptError(message, source, lineno, colno, error) {
  console.log(error);
  displayModalError("Javascript error:<br>" + message + "<br>" + error.stack);
}

function displayModalError(text) {
  document.getElementById('errordiv').innerHTML = "<pre>" + text + "</pre>";
  $("#error-modal").modal();
}

function showOKModal(message, timeoutMs = 1000) {
  document.getElementById('alert-modal-body-div').innerHTML = message;
  $("#alert-modal").modal();
  //Autohide after xxx ms
  setTimeout(function () { $("#alert-modal").modal('hide'); }, timeoutMs);
}

function getSizeSelection() {
  let elemSelect = document.getElementById('plate-size-select');
  let size = elemSelect.options[elemSelect.selectedIndex].value;
  return size;
}

function initPlatedesignUI() {

  let size = getSizeSelection();
  let table = createEmptyTable(size);
  let container = document.getElementById('table-div');
  container.innerHTML = "";
  container.appendChild(table);

  console.log("Hello");

  let plate = new Plate(size);
  console.log("plate", plate);


  plate.wellOrder.forEach(function (wellName, index) {

      //console.log("wellName", wellName);

      let cell = document.getElementById(wellName);
      cell.innerHTML = "" + index;
    });
  
}