/*
  Javascript version: ECMAScript 6 (Javascript 6)
 */


  class DataTable {
    constructor(apiEndpoint, options = {}) {
        this.apiEndpoint = apiEndpoint;
        this.rows = [];
        this.options = options;
        // Assign a default limit of 1000 if not specified in options
        this.limit = options.limit !== undefined ? options.limit : 1000;
        this.init();
    }

    init() {
        this.fetchAndDrawTable();
        this.setupOptionalFilterListener();
    }

    fetchAndDrawTable() {
        // Construct API URL based on whether limit is defined
        let apiUrl = this.limit ? `${this.apiEndpoint}/${this.limit}` : this.apiEndpoint;

        fetch(apiUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(json => {
                this.rows = json['result'];
                this.pre_transformations_hook()
                this.applyTransformations(); // Apply transformations (can be overridden by subclasses)
                this.drawTable();
            })
            .catch(error => {
                console.error('Failed to fetch data:', error);
                this.handleError(error); // Centralized error handling
            });
    }

    setupOptionalFilterListener() {
      // Only proceed if filterElementId is specified in options
      if (this.options.filterElementId) {
        const filterInput = document.getElementById(this.options.filterElementId);
        // Also check if the element actually exists in the DOM
        if (filterInput) {
          let debounceTimer;
          filterInput.addEventListener('input', () => {
            // Clear the existing timer on each input to reset the countdown
            clearTimeout(debounceTimer);

            debounceTimer = setTimeout(() => {
              const inputText = filterInput.value;
              // Apply the filter and redraw table if conditions are met
              if (inputText.length > 1 || inputText.length === 0) {
                this.drawTable();
              }
            }, 300); // Wait for 300ms after the last input
          });
        }
      }
    }

    handleError(error){
      console.error('Failed to fetch data:', error);
      // Assuming displayModalError is a function you have defined to show errors
      displayModalError(error);
    }

    pre_transformations_hook(){
      // nothing to do in baseclass
    }

    drawTable() {

      // Optional filtering
      let filter = this.options.filterElementId ? this.getRowFilter() : null;
      let filteredRows = [...this.rows];
      if (filter) {
        filteredRows = this.filterRows(filter, filteredRows);
      }

      let container = document.getElementById(this.options.tableDivId); // Assuming tableDivId is passed in options

      // Create Table
      let table = document.createElement('table');
      table.id = this.options.tableDivId + "-table"; // Use tableDivId from options
      table.className = 'table text-xsmall';

      // Clear previous table content
      container.innerHTML = '';

      console.log('draw table');

      if (filteredRows.length > 0) {
        // Add header row
        let headerRow = document.createElement('tr');
        filteredRows[0].forEach(header => {
          let headerCell = document.createElement('th');
          headerCell.textContent = header;
          headerRow.appendChild(headerCell);
        });
        table.appendChild(headerRow);

        // Add data rows
        for (let i = 1; i < filteredRows.length; i++) {
          let rowElement = document.createElement('tr');
          filteredRows[i].forEach(cell => {
            let cellElement = document.createElement('td');

            if (typeof cell == 'object' && cell !== null) {
              cellElement.textContent = JSON.stringify(cell);
            }else{
              cellElement.innerHTML = cell;
            }

            // // Check if the cell content is an object and convert to a JSON string if true
            // if (typeof cell === 'object' && cell !== null) {
            //   // Optionally, use JSON.stringify(cell, null, 2) for pretty-printed JSON
            //   console.log("cell is object not null")
            //   cellElement.textContent = JSON.stringify(cell);
            // } else {
            //   console.log("cell is text")
            //   cellElement.textContent = cell;
            // }
            rowElement.appendChild(cellElement);
          });
          table.appendChild(rowElement);
        }
      } else {
        let noDataRow = document.createElement('tr');
        let noDataCell = document.createElement('td');
        noDataCell.textContent = "No data available";
        noDataCell.colSpan = filteredRows[0].length;
        noDataRow.appendChild(noDataCell);
        table.appendChild(noDataRow);
      }

      container.appendChild(table);
      console.log("Table drawn successfully");
    }

    getRowFilter() {
      const filterElement = document.getElementById(this.options.filterElementId);
      if (filterElement) {
        const filter = filterElement.value.trim();
        return filter.length > 0 ? filter : null;
      } else {
        return null;
      }
    }

    filterRows(text, rows){
      // Convert the search text to lower case outside the loop for efficiency
      let lowerCaseText = text.toLowerCase();

      // Always include the header row in the filtered results
      let filtered = [rows[0]];

      // Now add rows (start from 1 since 0 is headers)
      for (let row = 1; row < rows.length; row++) {
        // Check if any column in the current row includes the text as a substring, case-insensitively
        // Convert null or undefined to an empty string before calling .includes()
        if (rows[row].some(col => (col !== null && col !== undefined ? col.toString().toLowerCase() : "").includes(lowerCaseText))) {
          filtered.push(rows[row]);
        }
      }

      return filtered;
    }

    applyTransformations(){
      // to be overridden in subclasses
    }

    addFileLinksColumn(rows) {
      let cols = rows[0];
      let resultColIndex = cols.indexOf("result");
      cols.splice(resultColIndex + 1, 0, "file_list-links");

      for (let nRow = 1; nRow < rows.length; nRow++) {
        let result = rows[nRow][resultColIndex];
        let cellContents = "";

        if (result != null) {
          for (let file_path of result.file_list) {
            if (file_path.endsWith(".pdf") || file_path.endsWith(".csv")) {
              let linkText = this.basename(file_path);
              let linkifiedFilePath = `<a href='/${file_path}'>${linkText}</a>`;
              cellContents += linkifiedFilePath + ", ";
            }
          }
        }

        rows[nRow].splice(resultColIndex + 1, 0, cellContents);
      }

      return rows;
    }

    addLinkToBarcodeColumn(rows) {
      console.log("Inside addLinkToBarcodeColumn");

      const barcodeColIndex = rows[0].indexOf("plate_barcode");
      const baseUrl = "https://imagedb.k8s-prod.pharmb.io/?";

      rows.forEach((row, index) => {
        if (index > 0) { // Skip header
          const barcode = row[barcodeColIndex];
          const linkUrl = `${baseUrl}barcode=${encodeURIComponent(barcode)}`;
          const newContents = `<a target='imagedb' href='${linkUrl}'>${barcode}</a>`;
          row[barcodeColIndex] = newContents;
        }
      });

      return rows;
    }

    addLogLinkColumn(rows) {
      console.log("Adding Log Link Column");
  
      const cols = rows[0];
      const idColIndex = cols.indexOf("id");
  
      // Add a header for the new column if it doesn't already exist
      const logLinkColumnIndex = cols.indexOf("Log");
      if (logLinkColumnIndex === -1) {
          cols.splice(9, 0, "Log");  // You might need to adjust the index as needed
      }
  
      // Process each data row
      rows.slice(1).forEach(row => {
          const id = row[idColIndex];
          let cellContents = "";

          const linkUrl = `log/${id}`;
          cellContents = `<a target='log' href='${linkUrl}'>Log</a>`;
  
          // Insert the new cell into the row
          if (logLinkColumnIndex === -1) {
              row.splice(9, 0, cellContents);
          } else {
              row[logLinkColumnIndex] = cellContents;
          }
      });

      return rows;
    }

    truncateColumn(rows, columnName, maxLength) {
      let columnIndex = rows[0].indexOf(columnName);
      for (let nRow = 1; nRow < rows.length; nRow++) {
        let content = rows[nRow][columnIndex];
        if (typeof content == 'object') {
          content = JSON.stringify(content);
        }
        if (content === "null") {
          content = "";
        }
        if (content != null && content.length > maxLength) {
          content = content.substring(0, maxLength) + ".....";
        }
        rows[nRow][columnIndex] = content;
      }
      return rows;
    }

    stringifyColumn(rows, columnName) {
      let columnIndex = rows[0].indexOf(columnName);
      for (let nRow = 1; nRow < rows.length; nRow++) {
        let content = rows[nRow][columnIndex];
        if (typeof content == 'object') {
          content = JSON.stringify(content);
        }
        if (content === "null") {
          content = "";
        }
        rows[nRow][columnIndex] = content;
      }
      return rows;
    }

    basename(str) {
      let separator = "/";cbcs
      return str.substr(str.lastIndexOf(separator) + 1);
    }
}

class ImageAnalysisTable extends DataTable {
  constructor(options = {}) {
    super('/api/list/image_analyses', options);
  }

  applyTransformations(){
        // Apply specific transformations
        this.rows = this.addControlsColumn(this.rows);
        this.rows = this.addFileLinksColumn(this.rows);
        this.rows = this.addLinkToBarcodeColumn(this.rows);
        this.rows = this.addLogLinkColumn(this.rows);
        this.rows = this.addSegmentationLinkColumn(this.rows);
        this.rows = this.addGoToSubLinkColumn(this.rows);
        this.rows = this.truncateColumn(this.rows, "result", 100);


  }

  addControlsColumn(rows) {
    let cols = rows[0];
    cols.splice(0, 0, "Controls");
    let idColIndex = cols.indexOf("id") - 1;
    let idColMeta = cols.indexOf("meta") - 1;

    for (let nRow = 1; nRow < rows.length; nRow++) {
      let id = rows[nRow][idColIndex];
      let meta = JSON.stringify(rows[nRow][idColMeta]);
      let deleteLink = `<a href='#' onClick='confirmDeleteAnalysis(${id});'>Delete</a>`;
      let stopLink = `<a href='#' onClick='confirmStopAnalysis(${id});'>Stop</a>`;
      let restartLink = `<a href='#' onClick='confirmRestartAnalysis(${id});'>Restart</a>`;
      let editMetaLink = `<a href='#' onClick='updateMeta(${id}, ${meta});'>Edit meta</a>`;
      let newCellContent = deleteLink + "<br>" + stopLink + "<br>" + restartLink + "<br>" + editMetaLink;
      rows[nRow].splice(0, 0, newCellContent);
    }

    return rows;
  }

  addGoToSubLinkColumn(rows) {
    console.log("Inside addGoToSubLinkColumn");

    const idColIndex = rows[0].indexOf("id");
    const baseUrl = "/index.html#";

    rows.forEach((row, index) => {
      if (index > 0) { // Skip header
        const id = row[idColIndex];
        const linkUrl = `${baseUrl}${encodeURIComponent(id)}`;
        const newContents = `<a href='${linkUrl}'>${id}</a>`;
        row[idColIndex] = newContents;
      }
    });

    return rows;
  }

  addSegmentationLinkColumn(rows) {
    console.log("Adding Segmentation Link Column");

    const cols = rows[0];
    const idColIndex = cols.indexOf("id");
    const metaColIndex = cols.indexOf("meta");

    // Add a header for the new column if it doesn't already exist
    const segmentationLinkColumnIndex = cols.indexOf("Segmentation Links");
    if (segmentationLinkColumnIndex === -1) {
        cols.splice(11, 0, "Segmentation Links");  // You might need to adjust the index as needed
    }

    // Process each data row
    rows.slice(1).forEach(row => {
        const id = row[idColIndex];
        const meta = row[metaColIndex];
        let cellContents = "";

        // Check if the meta data qualifies for a segmentation link
        if (meta && meta['type'] && meta['type'].includes("cp-features")) {
            const linkUrl = `segmentation/${id}`;
            cellContents = `<a target='segmentation' href='${linkUrl}'>Segmentation</a>`;
        }

        // Insert the new cell into the row
        if (segmentationLinkColumnIndex === -1) {
            row.splice(11, 0, cellContents);
        } else {
            row[segmentationLinkColumnIndex] = cellContents;
        }
    });

    return rows;
  }

}

class ImageSubAnalysisTable extends DataTable {
  constructor(options = {}) {
    super('/api/list/image_sub_analyses', options);
  }

  applyTransformations(){
    this.rows = this.addLinkToBarcodeColumn(this.rows);
    this.rows = this.truncateColumn(this.rows, "result", 100);
    this.rows = this.stringifyColumn(this.rows, "meta");

    // add named anchor
    this.rows = this.addSubAnalysisAnchor(this.rows);
  }

  addSubAnalysisAnchor(rows){

    console.log("Inside addGoToSubLinkColumn");

    // Define which column is barcode column
    let cols = rows[0];
    let id_col_index = cols.indexOf("analyses_id");

    // Start from row 1 (0 is headers)
    for (let nRow = 1; nRow < rows.length; nRow++) {
      let id = rows[nRow][id_col_index];
      let new_contents = "<a name='" + id + "'>" + id + "</a>";
      // replace cell
      rows[nRow][id_col_index]  = new_contents;
    }
    return rows;
  }

}

class PlateAcqTable extends DataTable {
  constructor(options = {}) {
    super('/api/list/plate_acquisition/', options);
  }

  applyTransformations(){
    this.rows = this.addLinkToBarcodeColumn(this.rows);
  }

}

class JobsTable extends DataTable {
  constructor(options = {}) {
    super('/api/list/jobs', options);
  }

  pre_transformations_hook(){
    this.drawJobStats()
  }

  applyTransformations(){
    this.addShowLogColumn()
  }


  addShowLogColumn(){
    // Add show log column
    let cols = this.rows[0];
    let name_col_index = cols.indexOf("NAME");
    for (let nRow = 1; nRow < this.rows.length; nRow++) {
      let job_name = this.rows[nRow][name_col_index];
      let new_cell_content = "<a href='#' onclick='viewJobLog(\"" + job_name + "\");'>Show log</a>"
      this.rows[nRow].push(new_cell_content);
    }
  }

  addLogColumn(){
    // Define which column is barcode column
    let cols = this.rows[0];
    let error_col_index = cols.indexOf("error");
    let id_col_index = cols.indexOf("id");

    let base_url = "/error-log/";

    // Start from row 1 (0 is headers)
    for (let nRow = 1; nRow < this.rows.length; nRow++) {

      let error = this.rows[nRow][error_col_index];

      if(error && error.length > 0){
        console.log("error", error);
        let id = this.rows[nRow][id_col_index];
        let link_url = base_url + encodeURI(id);
        let new_contents = "<a target='pipeline-error' href='" + link_url + "'>" + error + "</a>"
        // replace cell
        this.rows[nRow][error_col_index]  = new_contents;
      }
    }
  }

  drawJobStats() {
    // Calculate stats by looping rows
    let cols = this.rows[0];
    let active_col_index = cols.indexOf("ACTIVE");
    let succeeded_col_index = cols.indexOf("SUCCEEDED");
    let failed_col_index = cols.indexOf("FAILED");

    let active = 0;
    let succeeded = 0;
    let failed = 0;

    for (let nRow = 1; nRow < this.rows.length; nRow++) {
      active +=  parseInt(this.rows[nRow][active_col_index]);
      succeeded +=  parseInt(this.rows[nRow][succeeded_col_index]);
      failed +=  parseInt(this.rows[nRow][failed_col_index]);
    }

    let total = this.rows.length -1; // -1 because of Header row
    let queued = total - active - succeeded - failed;

    document.getElementById("n_total_jobs").textContent = total;
    document.getElementById("n_active_jobs").textContent = active;
    document.getElementById("n_succeeded_jobs").textContent = succeeded;
    document.getElementById("n_queued_jobs").textContent = queued;
    document.getElementById("n_failed_jobs").textContent = failed;
  }
}

class PipelineFilesTable extends DataTable {
  constructor(options = {}) {
    super('/api/list/pipelinefiles', options);
  }
}


function apiCreatePlateAcqTable() {

  let limit = 500;

  fetch('/api/list/plate_acquisition/' + limit)

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawPlateAcqTable(json['result']);

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

function apiCreateJobsTable() {

  fetch('/api/list/jobs')

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawJobsTable(json['result']);
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


function apiGetJobLog(jobName) {

  fetch('/api/list/joblog/' + jobName)

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          //document.getElementById('logdiv').innerHTML = "<pre>" + json['result'] + "</pre>";
          //$("#log-modal").modal();
          let w = window.open("", "joblog");
          w.document.open();
          w.document.write("<pre>" + json['result'] + "</pre>");
          w.document.close();
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





function apiCreatePipelineFilesTable() {

  fetch('/api/list/pipelinefiles')

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawTable(json['result'], "pipelinefiles-table-div")

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

function apiCreateImageAnalysesTable() {

  let limit = 1000;

  fetch('/api/list/image_analyses/' + limit )

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawImageAnalysisTable(json['result']);

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

function apiCreateImageSubAnalysesTable() {

  let limit = 1000;

  fetch('/api/list/image_sub_analyses/' + limit )

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawImageSubAnalysisTable(json['result']);

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

function removeChildren(domObject) {
  while (domObject.firstChild) {
    domObject.removeChild(domObject.firstChild);
  }
}

function drawJobsTable(rows){

  // First (before manipulating rows draw stats)
  drawJobStats(rows)

  // copy array
  rows = [...rows];

  // Before drawing table add ("Show logs column")
  // Add new column header to end of header row
  let cols = rows[0];
  cols.push("log")

  // Remove rows that are not failed or error
  let status_col_index = cols.indexOf("STATUS");
  for (let nRow = rows.length -1; nRow > 0; nRow--) {
    let status = rows[nRow][status_col_index];
    if(status == 'Failed' || status == 'Error'){
      // Keep row
    }
    else{
      // delete row
      rows.splice(nRow, 1);
    }
  }

  // Add show log column
  let name_col_index = cols.indexOf("NAME");
  for (let nRow = 1; nRow < rows.length; nRow++) {
    let job_name = rows[nRow][name_col_index];
    let new_cell_content = "<a href='#' onclick='viewJobLog(\"" + job_name + "\");'>Show log</a>"
    rows[nRow].push(new_cell_content);
  }

  drawTable(rows, "jobs-table-div")
}

function drawJobStats(rows, divname) {

    let cols = rows[0];

    // Calculate stats by looping rows
    let active_col_index = cols.indexOf("ACTIVE");
    let succeeded_col_index = cols.indexOf("SUCCEEDED");
    let failed_col_index = cols.indexOf("FAILED");

    let active = 0;
    let succeeded = 0;
    let failed = 0;

    for (let nRow = 1; nRow < rows.length; nRow++) {

      active +=  parseInt(rows[nRow][active_col_index]);
      succeeded +=  parseInt(rows[nRow][succeeded_col_index]);
      failed +=  parseInt(rows[nRow][failed_col_index]);

    }

    let total = rows.length -1; // -1 because of Header row
    let queued = total - active - succeeded - failed;

    document.getElementById("n_total_jobs").textContent = total;
    document.getElementById("n_active_jobs").textContent = active;
    document.getElementById("n_succeeded_jobs").textContent = succeeded;
    document.getElementById("n_queued_jobs").textContent = queued;
    document.getElementById("n_failed_jobs").textContent = failed;

    console.log("drawJobStats finished")

}

function filterTableRows(text, rows){
  // Always include the header row in the filtered results
  let filtered = [rows[0]];

  // Now add rows (start from 1 since 0 is headers)
  for (let row = 1; row < rows.length; row++) {
      console.log[row]
      // Check if any column in the current row includes the text as a substring
      // Convert null or undefined to an empty string before calling .includes()
      if (rows[row].some(col => (col !== null && col !== undefined ? col.toString() : "").includes(text))) {
        filtered.push(rows[row]);
      }
  }

  return filtered;
}


// Notebook link
// http(s)://<server:port>/<lab-location>/lab/tree/path/to/notebook.ipynb

function drawImageAnalysisTable(rows){
  console.log("inside drawImageAnalysisTable, rows", rows)

  filter = getRowFilter()
  if(filter){
    rows = filterTableRows("specs", rows)
  }

  // Before drawing table, linkify barcode
  rows = addLinkToBarcodeColumn(rows);

  // Before drawing table, add log column
  rows = addLogLinkColumn(rows);

  // Before drawing table add ("Controls")
  rows = addControlsColumn(rows)

  // Before drawing table add "Segmentation link" to links column
  rows = addSegmentationLinkColumn(rows)

  // Before drawing table add "Segmentation link" to links column
  rows = addGoToSubLinkColumn(rows)

  // Before drawing table add ("File-Links")
  //rows = addFileLinksColumn(rows)

  // Truncate "result" column
  rows = truncateColumn(rows, "result", 100);


  drawTable(rows, "image_analyses-table-div");

  console.log("done drawImageAnalysisTable")
}

function filterOutFromMeta(rows, meta_val){

  let cols = rows[0];
  let meta_col_index = cols.indexOf("meta");

  filtered = []
  filtered.push(rows[0])
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let meta = rows[nRow][meta_col_index];

    if (meta && meta[meta_val] === true) {
      console.log("meta", meta);
    } else {
      filtered.push(rows[nRow]);
    }
  }

  return filtered
}

function drawPlateAcqTable(rows){

  // Before drawing table, linkify barcode
  rows = addLinkToBarcodeColumn(rows);

  drawTable(rows, "plate-acq-table-div");
}

function addLinkToBarcodeColumn(rows){

  console.log("Inside addLinkToBarcodeColumn");

  let cols = rows[0];

  // Define which column is barcode column
  let barcode_col_index = cols.indexOf("plate_barcode");

  let base_url = "https://imagedb.k8s-prod.pharmb.io/?";

  // Start from row 1 (0 is headers)
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let barcode = rows[nRow][barcode_col_index];
    //console.log("barcode", barcode);

    let link_url = base_url + "barcode=" + encodeURI(barcode)

    let new_contents = "<a target='imagedb' href='" + link_url + "'>" + barcode + "</a>"

    // replace cell
    rows[nRow][barcode_col_index]  = new_contents;
  }

  return rows;

}

function addGoToSubLinkColumn(rows){

  console.log("Inside addGoToSubLinkColumn");

  let cols = rows[0];

  // Define which column is barcode column
  let id_col_index = cols.indexOf("id");

  let base_url = "https://pipelinegui.k8s-prod.pharmb.io/index.html#";

  // Start from row 1 (0 is headers)
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let id = rows[nRow][id_col_index];

    let link_url = base_url + encodeURI(id);

    let new_contents = "<a href='" + link_url + "'>" + id + "</a>";

    // replace cell
    rows[nRow][id_col_index]  = new_contents;
  }

  return rows;

}


function addLinkToErrorColumn_old(rows){

  console.log("Inside addLinkToErrorColumn_old", rows);

  let cols = rows[0];

  let error_col_index = cols.indexOf("error");
  let id_col_index = cols.indexOf("id");

  let base_url = "/error-log/";

  // Start from row 1 (0 is headers)
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let error = rows[nRow][error_col_index];

    if(error && error.length > 0){
      console.log("error", error);
      let id = rows[nRow][id_col_index];
      let link_url = base_url + encodeURI(id);
      let new_contents = "<a target='pipeline-error' href='" + link_url + "'>" + error + "</a>"
      // replace cell
      rows[nRow][error_col_index]  = new_contents;
    }


  }

  return rows;

}


function drawImageSubAnalysisTable(rows){

  console.log("Inside drawImageSubAnalysisTable");

  // Truncate "result" column
  rows = truncateColumn(rows, "result", 100);

  // add named anchor
  rows = addSubAnalysisAnchor(rows);

  drawTable(rows, "image_sub_analyses-table-div");

}

function addNotebookLinkColumn(rows){

  console.log("Inside Add NotebokLinkColumn");

  // Add new column header to end of header row
  let cols = rows[0];
  cols.push("Jupyter Link")

  // Define which column in result contains the result
  let result_col_index = cols.indexOf("result");

  let base_url = "https://cpp-notebook-nogpu.k8s-prod.pharmb.io" + "/lab/tree" + "/cpp_work/";

  // Start from row 1 (0 is headers)
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let result = rows[nRow][result_col_index];
    console.log("result_list", result);

    let cell_contents = "";

    if(result && result.job_folder){

      let link_url = base_url + result.job_folder


       // results/384-P000014-helgi-U2OS-24h-L1-copy2/60/15

       cell_contents = "<a target='notebook' href='" + link_url + "'>Link</a>"

    }

    rows[nRow].push(cell_contents);

  }

  return rows;

}

function addSegmentationLinkColumn(rows){

  console.log("Inside Add addSegmentationLinkColumn");

  let cols = rows[0];

  // Define which column in result contains the result
  let id_col_index = cols.indexOf("id");
  let meta_col_index = cols.indexOf("meta");

  // Add header
  cols.splice(10, 0, "links");

  // Loop table rows
  // Start from row 1 (0 is headers)

  for (let nRow = 1; nRow < rows.length; nRow++) {

    let id = rows[nRow][id_col_index];
    let meta = rows[nRow][meta_col_index];

    let cell_contents = "";

    console.log("meta", meta);

    if(meta && meta['type'].indexOf("cp-features") > -1){

      console.log("meta", meta);

      let link_url = "segmentation/" + id;
      cell_contents = "<a target='segmentation' href='" + link_url + "'>Segmentation</a>"
    }

    // insert cell
    rows[nRow].splice(10,0,cell_contents);

  }

  return rows;

}


function addControlsColumn(rows){

  // Add header
  let cols = rows[0];
  cols.splice(0, 0, "Controls");

  // Define which column in result contains the id (-1 because new Controls is inserted in front)
  let id_col_index = cols.indexOf("id") - 1;
  let id_col_meta = cols.indexOf("meta") - 1;

  // Create new cell in all rows
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let id = rows[nRow][id_col_index];
    let meta = JSON.stringify(rows[nRow][id_col_meta]);

    let deleteLink = "<a href='#' onClick='confirmDeleteAnalysis(" + id + ");'>Delete</a>";
    let stopLink = "<a href='#' onClick='confirmStopAnalysis(" + id + ");'>Stop</a>";
    let restartLink = "<a href='#' onClick='confirmRestartAnalysis(" + id + ");'>Restart</a>";
    let editMetaLink = "<a href='#' onClick='updateMeta(" + id + "," + meta + ");'>Edit meta</a>";
    let new_cell_content = deleteLink + "<br>" + editMetaLink;

    // insert cell first
    rows[nRow].splice(0,0,new_cell_content);

  }

  return rows;

}

function basename(str) {
  let separator = "/";
  return str.substr(str.lastIndexOf(separator) + 1);
}


function addFileLinksColumn(rows){
  console.log("Inside addFileLinksColumn");

  // Add header to new cell
  let cols = rows[0];
  result_col_index = cols.indexOf("result");

  cols.splice(result_col_index + 1, 0, "file_list-links");
  console.log("rows.length", rows.length);

  // Create new cell in all rows
  for (let nRow = 1; nRow < rows.length; nRow++) {

    //console.log("nRow:", nRow);

    let result = rows[nRow][result_col_index];
    //console.log("result:)", result);

    let cell_contents = "";

    if(result != null){
      //console.log("result.file_list", result.file_list);
      for(let file_path of result.file_list){
        //console.log("file_path", file_path);
        if(file_path.endsWith(".pdf") || file_path.endsWith(".csv")){
          //console.log("file_path", file_path);

          let link_text = basename(file_path);

          let linkified_file_path = "<a href='/" + file_path + "'>" + link_text + "</a>";
          cell_contents += linkified_file_path + ", ";
        }
      }
    }

    // Add result column result with new result content
    rows[nRow].splice(result_col_index + 1,0,cell_contents);

  }

  return rows;
}

function truncateColumn(rows, column_name, trunc_length){
  let cols = rows[0];
  column_index = cols.indexOf(column_name);

  for (let nRow = 1; nRow < rows.length; nRow++) {
    //console.log("nRow:", nRow);

    let content = rows[nRow][column_index];
    if(typeof content == 'object'){
      content = JSON.stringify(content);
    }

    if(content === "null"){
      content = "";
    }

    if(content != null && content.length > trunc_length){
      content = content.substring(0, trunc_length);
      content += "....."
    }

    rows[nRow][column_index] = content;
  }

  return rows;

}

function drawTable(rows, divname) {

  console.log("rows", rows);
  console.log("divname", divname);

  let container = document.getElementById(divname);

  // Create Table
  let table = document.createElement('table');
  table.id = divname + "-table";
  table.className = 'table text-xsmall';

  // First add header row
  let headerRow = document.createElement('tr');

  // First row in rows is header
  let cols = rows[0];

  for (let col = 0; col < cols.length; col++) {

    let header_cell = document.createElement('th');
    header_cell.innerHTML = cols[col];
    //header_cell.className = 'headerCell';
    headerRow.appendChild(header_cell);
  }
  table.appendChild(headerRow);

  // Now add rows (start from 1 since 0 is headers)
  for (let row = 1; row < rows.length; row++) {
    let rowElement = document.createElement('tr');
    for (let col = 0; col < cols.length; col++) {

      let cell = document.createElement('td');
      let content = rows[row][col];
      if(typeof content == 'object'){
        content = JSON.stringify(content);
      }

      if(content === "null"){
        content = "";
      }

      // Truncate large content
      TRUNCATE_LEN = 1000;
      if(content != null && content.length > TRUNCATE_LEN){
        content = content.substring(0, TRUNCATE_LEN);
        content += "....."
      }

      cell.innerHTML = content;

      //cell.className = 'tableCell';
      rowElement.appendChild(cell);
    }

    table.appendChild(rowElement);
  }

  removeChildren(container);
  container.append(table)

  console.log("drawTable finished")
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
  document.getElementById('errormodalLabel').innerHTML = "Error";
  $("#error-modal").modal();
}

function displayModalMessage(text) {
  document.getElementById('errordiv').innerHTML = "" + text;
  document.getElementById('errormodalLabel').innerHTML = "Problem";
  $("#error-modal").modal();
}

function showOKModal(message, timeoutMs = 1000) {
  document.getElementById('alert-modal-body-div').innerHTML = message;
  $("#alert-modal").modal();
  //Autohide after xxx ms
  setTimeout(function () { $("#alert-modal").modal('hide'); }, timeoutMs);
}

var _loaded_analysisPipelines = null;

function setAnalysisPipelines(pipelines) {
  _loaded_analysisPipelines = pipelines;
}

function getAnalysisPipelines() {
  return _loaded_analysisPipelines;
}

function getAnalysisPipelineFromName(name){
  // Loop until name is fount, then return protocol-object
  for (let analysis_pipeline of _loaded_analysisPipelines) {
    if (name === analysis_pipeline['name']) {
      //console.log("String match");
      return analysis_pipeline;
    }
  }
}

function viewJobLog(jobName){

  apiGetJobLog(jobName);

}

function apiLoadAnalysisPipelines(selected = "") {

  fetch('/api/analysis-pipelines/')
    .then(response => response.json())
    .then(data => {

      console.log('protocols data', data);

      setAnalysisPipelines(data.result);

      console.log("AnalysisPipelines loaded");
      updateAnalysisPipelinesUI(selected);

    })
    .catch(error => {
      console.error('Error:', error);
    })
}

function apiLoadPlateAcqSelect(selected = "") {

  let limit = 500;

  fetch('/api/list/plate_acquisition/' + limit )
    .then(response => response.json())
    .then(data => {

      console.log('plate_acquisition data', data);

      updatePlateAcqSelect(data.result, selected);

    })
    .catch(error => {
      console.error('Error:', error);
    })
}

function updatePlateAcqSelect(plateAcqs, selected = "") {

  // This select is not available on all pages, return if not
  let elemSelect = document.getElementById('plate_acq-select');
  if (elemSelect == null) {
    return;
  }

  // reset
  elemSelect.options.length = 0;
  elemSelect.options.selectedIndex = -1;

  // Just loop all elements
  plateAcqs.forEach(function (plateAcq, index) {
    //console.log("plateAcq", plateAcq)
    elemSelect.options.add(new Option(plateAcq[0]));
    // Maybe select option
    if (selected === plateAcq[0]) {
      elemSelect.options.selectedIndex = index;
    }
  });
}






function updateAnalysisPipelinesUI(selected = "") {
  updateAnalysisPipelinesSelect(selected);
  redrawSelectedAnalysisPipeline();
}

/*
function setAnalysisPipelinesSelection(analysisPineline) {
  let elemSelect = document.getElementById('analysis_pipelines-select);
  elemSelect.selectedIndex = getSelectIndexFromSelectValue(elemSelect, protocol);
}
*/


function processPipelinesSelect(elemSelectId, processFunction, selected = "") {
  let elemSelect = document.getElementById(elemSelectId);
  if (elemSelect == null) {
    return;
  }

  elemSelect.options.length = 0;

  // Add an empty option at the beginning
  elemSelect.options.add(new Option("", ""));

  let pipelines = getAnalysisPipelines();
  let processedPipelines = processFunction(pipelines);

  console.log('processedPipelines', processedPipelines);

  processedPipelines.forEach(function (pipeline, index) {
    elemSelect.options.add(new Option(pipeline['name']));
    if (selected === pipeline['name']) {
      elemSelect.options.selectedIndex = index + 1; // Adjust index due to the new empty option
    }
  });

  // If no specific selection is made, keep the empty option selected
  if (!selected) {
    elemSelect.options.selectedIndex = 0;
  }
}

function filterStandardPipelines(pipelines) {
  return pipelines.filter(pipeline => pipeline['meta'] && pipeline['meta']['analysis_meta'] && pipeline['meta']['analysis_meta']['standard_pipeline']);
}

function getLatestPipelines(pipelines) {
  return pipelines.sort((a, b) => b['modified'] - a['modified']).slice(0, 20);
}

function getAllPipelines(pipelines) {
  return pipelines;
}


function updateAnalysisPipelinesSelect(selected = "") {
  updateAnalysisPipelinesSelectAll(selected);
  updateAnalysisPipelinesSelectStandard(selected);
  updateAnalysisPipelinesSelectLatest(selected);
}

function updateAnalysisPipelinesSelectStandard(selected = "") {
  processPipelinesSelect('analysis_pipelines-select-std', filterStandardPipelines, selected);
}

function updateAnalysisPipelinesSelectLatest(selected = "") {
  processPipelinesSelect('analysis_pipelines-select-latest', getLatestPipelines, selected);
}

function updateAnalysisPipelinesSelectAll(selected = "") {
  processPipelinesSelect('analysis_pipelines-select', getAllPipelines, selected);
}


function getFirstSelectedPipeline() {
  // Array of select element IDs
  const selectIds = [
    'analysis_pipelines-select-std',
    'analysis_pipelines-select-latest',
    'analysis_pipelines-select'
  ];

  for (let id of selectIds) {
    let selectElement = document.getElementById(id);
    if (selectElement && selectElement.selectedIndex > 0) {
      // selectedIndex > 0 to exclude the blank option (which is at index 0)
      return selectElement.options[selectElement.selectedIndex].value;
    }
  }

  return null; // Return null if no selection or only blank options are selected
}

function redrawSelectedAnalysisPipeline() {

  let pipelineName = getFirstSelectedPipeline();

  console.log("pipelineName", pipelineName);

  if(pipelineName === undefined || pipelineName === null){
    pipelineName = ""
  }

  let pipeline_meta = "";
  if(pipelineName !== ""){
    let pipeline = getAnalysisPipelineFromName(pipelineName);
    console.log("pipeline", pipeline);
    pipeline_meta = JSON.stringify(pipeline['meta'], null, 2);
  }

  // Update textfield
  document.getElementById('analysis_pipeline-meta').value = pipeline_meta;

  // Update modal save and save as, delete .. text fields (if they are present)
  if(document.getElementById('save-analysis_pipeline-name')){
    document.getElementById('save-analysis_pipeline-name').value = pipelineName;
  }
  if(document.getElementById('delete-analysis_pipeline-name')){
    document.getElementById('delete-analysis_pipeline-name').value = pipelineName;
  }

}

function verifyJson(displayOKResult, ) {
  text = document.getElementById('plate-protocol-steps').value;
  JSON.parse(text);
  if (displayOKResult === true) {
    showOKModal("JSON Verified OK");
  }
}

function reloadAnalysisPipelinesUI(selected = "") {
  apiLoadAnalysisPipelines(selected);
}

function parsePlateAcquisitionInput(input) {
  let result = [];

  // Split the input by commas
  let parts = input.split(',').map(part => part.trim());

  for (let part of parts) {
      if (part.includes('-')) {
          // Handle range, e.g., "1000-1003" or "1000 - 2000"
          let [start, end] = part.split('-').map(num => parseInt(num.trim(), 10));
          if (!isNaN(start) && !isNaN(end) && start <= end) {
              for (let i = start; i <= end; i++) {
                  result.push(i);
              }
          } else {
              console.error(`Invalid range: ${part}`);
          }
      } else {
          // Handle single integer
          let num = parseInt(part, 10);
          if (!isNaN(num)) {
              result.push(num);
          } else {
              console.error(`Invalid number: ${part}`);
          }
      }
  }
  return result;
}

function getTrimmedInputValue(elementId) {
  return document.getElementById(elementId).value.trim();
}

function isPriorityOneWithoutFilters(priority, wellFilter, siteFilter) {
  return parseInt(priority, 10) === 1 && !wellFilter && !siteFilter;
}

function isValidWellFilter(wellFilter) {
  const wellFilters = wellFilter.split(',').map(filter => filter.trim());
  const wellFilterRegex = /^[A-Z][0-9]{2}$/;

  return wellFilters.every(filter => wellFilterRegex.test(filter));
}

function isCheckboxChecked(checkboxId) {
  const checkbox = document.getElementById(checkboxId);
  return checkbox && checkbox.checked;
}

function verifyRunAnalysisInputData() {
  const acqId = getTrimmedInputValue('plate_acq-input');
  const wellFilter = getTrimmedInputValue('well_filter-input');
  const siteFilter = getTrimmedInputValue('site_filter-input');
  const priority = getTrimmedInputValue('priority-input');
  const zPlane = getTrimmedInputValue('z_plane-input');

  if (isPriorityOneWithoutFilters(priority, wellFilter, siteFilter)) {
      alert("Priority 1 is reserved for short jobs where well and/or site filter is applied");
      return;
  }

  if (wellFilter && !isValidWellFilter(wellFilter)) {
      displayModalMessage("Well must be a capital letter followed by exactly two digits (e.g., A01, B12).");
      return;
  }

  const pipeline = getFirstSelectedPipeline();
  if (!pipeline) {
      displayModalMessage("Pipeline is blank. No can do.");
      return;
  }

  const plateAcqs = parsePlateAcquisitionInput(acqId);

  let message = `PlateAcqID: ${plateAcqs.join(', ')}<br><br>Pipeline: ${pipeline}`;

  if (priority) {
      message += `<br><br>Priority: ${priority}`;
  }
  if (wellFilter) {
      message += `<br><br>Well-Filter: ${wellFilter}`;
  }
  if (zPlane) {
      message += `<br><br>Z-Plane: ${zPlane}`;
  }

  if (isCheckboxChecked('run-uppmax-cbx')) {
      message += `<br><br>Run-on-uppmax: True`;
  }

  if (isCheckboxChecked('run-dardel-cbx')) {
      message += `<br><br>Run-on-dardel: True`;
  }

  document.getElementById('runAnalysisModalBody').innerHTML = message;
  $('#run-analysis-modal').modal('show');

}



function verifyRunAnalysisInputData_old(){

  let acq_id = document.getElementById("plate_acq-input").value;
  let well_filter = document.getElementById("well_filter-input").value.trim();
  let site_filter = document.getElementById("site_filter-input").value.trim();
  let priority = document.getElementById("priority-input").value.trim();


  /// Check if priority is 1
  if (parseInt(priority, 10) === 1) {

      // Check if both well_filter and site_filter are empty
      if (!well_filter && !site_filter) {
        alert("Priority 1 is reserved for short jobs where well and/or site filter is applied");
        return;
      }
  }

  // Check well filter format
  if (well_filter) {
    // Split well_filter by commas and trim each value
    let wellFilters = well_filter.split(',').map(filter => filter.trim());

    // Validate each well filter
    const wellFilterRegex = /^[A-Z][0-9]{2}$/;
    for (let filter of wellFilters) {
        if (!wellFilterRegex.test(filter)) {
            // Well filter is not in the correct format
            alert();
            displayModalMessage("Well must be a capital letter followed by exactly two digits (e.g., A01, B12).");
            return;
        }
    }
  }

  // Check if 'pipelineName' is not blank
  pipeline = getFirstSelectedPipeline()
  if(! pipeline){
    displayModalMessage("Pipeline is blank. No can do.");
    return;
  }

  // Set dialog
  // plate_acquisition can be comma separated integer the value can also be a range specified as 1000-1003
  let plateAcqs = parsePlateAcquisitionInput(acq_id);
  let acqIdString = plateAcqs.join(', ');

  message = "PlateAcqID: " + acqIdString
  message += "<br><br>Pipeline: " + pipeline + ""

  if (priority) {
    message += "<br><br>Priority: " + priority;
  }
  if (well_filter) {
    message += "<br><br>Well-Filter: " + well_filter;
  }
  if (site_filter) {
    message += "<br><br>Site-Filter: " + site_filter;
  }

  // Check if the checkbox is checked
  const runUppmaxCbx = document.getElementById('run-uppmax-cbx');
  if (runUppmaxCbx && runUppmaxCbx.checked) {
    message += "<br><br>Run-on-uppmax: True";
  }

  // Check if the checkbox is checked
  const runDardelCbx = document.getElementById('run-dardel-cbx');
  if (runDardelCbx && runDardelCbx.checked) {
    message += "<br><br>Run-on-dardel: True";
  }

  document.getElementById('runAnalysisModalBody').innerHTML = message;
  $('#run-analysis-modal').modal('show');

}


function apiRunAnalysis() {

  // Check if 'pipelineName' is not blank
  if(! getFirstSelectedPipeline()){
    displayModalError("Pipeline is blank. No can do.");
    return; // Exit the function
  }

  let formData = new FormData(document.getElementById('main-form'));

  console.log("form data", formData);

  fetch('/api/analysis-pipelines/run', {
    method: 'POST',
    body: formData
    })
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          $("#run-analysis-modal").modal('hide');
          showOKModal("Analysis submitted OK");
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

function apiGenerateImgset(){

  // delete current content in textarea
  document.getElementById('imgset-textarea').value = ""

  let name = document.getElementById('save-imgset-name').value;

  console.log("form element", document.getElementById('main-form'));

  let formData = new FormData(document.getElementById('main-form'));

  console.log("form data", formData);

  formData.append("imgset-name", name);

  console.log("form data", formData);

  fetch('/api/imgset/save', {
    method: 'POST',
    body: formData
    })
    .then(function (response) {
      if (response.status === 200) {
        response.text().then(function (text) {

          document.getElementById('imgset-textarea').value = text;

          $("#save-imgset-modal").modal('hide');

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


function apiSaveAnalysisPipeline() {
  // verify
  //verifyProtocolStepsJson(false);

  let name = document.getElementById('save-analysis_pipeline-name').value;

  console.log("form element", document.getElementById('main-form'));

  let formData = new FormData(document.getElementById('main-form'));

  console.log("form data", formData);

  formData.append("analysis_pipeline-name", name);

  console.log("form data", formData);

  fetch('/api/analysis-pipelines/save', {
    method: 'POST',
    body: formData
    })
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          reloadAnalysisPipelinesUI(name);
          $("#save-analysis_pipeline-modal").modal('hide');
          showOKModal("Analysis Saved");

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

function apiDeleteAnalysisPipeline() {

  let deleteName = document.getElementById('delete-analysis_pipeline-name').value;
  let deleteURL = "/api/analysis-pipelines/delete/" + deleteName;

  fetch(deleteURL)
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          location.reload();
          $("#delete-analysis_pipeline-modal").modal('hide');
          showOKModal("Analysis Deleted");

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

function apiDeleteAnalysis(){

  let deleteID = document.getElementById('delete-analysis-id-input').value;
  let deleteURL = "/api/analysis/delete/" + deleteID;

  fetch(deleteURL)
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          location.reload();
          $("#delete-analysis-modal").modal('hide');
          showOKModal("Analysis Deleted");
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


function confirmDeleteAnalysis(id){
  let elem = document.getElementById("delete-analysis-id-input");
  elem.value = id;
  $("#delete-analysis-modal").modal();

}

function updateMeta(id, meta){
  document.getElementById("edit-meta-analysis-id-input").value = id;
  document.getElementById("edit-meta-input").value = JSON.stringify(meta, null, 2);

  $("#edit-meta-modal").modal();

}

function apiUpdateMeta(){

  let formData = new FormData(document.getElementById('edit-meta-form'));


  fetch('/api/analysis/update_meta', {
    method: 'POST',
    body: formData
    })
    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

            location.reload();
            $("#edit-meta-modal").modal('hide');
            showOKModal("Meta updated");
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


function editMetaPresetsChanged(){
  let elem = document.getElementById("edit-meta-presets");

  let preset_text = elem.options[elem.selectedIndex].text;
  console.log("preset_text",preset_text);
  let json_text = JSON.parse(preset_text);
  console.log("json_text",json_text)
  let pretty_text = JSON.stringify(json_text, null, 2);

  document.getElementById("edit-meta-input").value = pretty_text;
}

function saveImgsetAsLocalFile() {
    let textToSave = document.getElementById("imgset-textarea").value;
    let textToSaveAsBlob = new Blob([textToSave], {type:"text/plain"});
    let textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);

    let acq_id = document.getElementById("plate_acq-input").value;
    let well_filter = document.getElementById("well_filter-input").value;
    let site_filter = document.getElementById("site_filter-input").value;

    // Create a name
    let stringsArray = ["imgset", acq_id, well_filter, site_filter];
    // remove empty parts
    let joinedString = stringsArray.filter(str => str !== "").join("-");
    let fileNameToSaveAs = joinedString + ".csv";

    let downloadLink = document.createElement("a");
    downloadLink.download = fileNameToSaveAs;
    downloadLink.innerHTML = "Save File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = function(event) {document.body.removeChild(event.target);};
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);

    downloadLink.click();
}

function initIndexPage() {
  console.log("Inside initIndexPage()");

  new ImageAnalysisTable({
    tableDivId: 'image_analyses-table-div',
    filterElementId: 'filter-input' // Only if you have a filter input element
  });

  new ImageSubAnalysisTable({
    tableDivId: 'image_sub_analyses-table-div',
    filterElementId: 'filter-input' // Only if you have a filter input element
  });

  new JobsTable({
    tableDivId: 'jobs-table-div',
    limit: null
  });

}

function initCreateAnalysisPage() {
  apiLoadAnalysisPipelines();

  new PipelineFilesTable({
    tableDivId: 'pipelinefiles-table-div',
    limit: null
  });
}

function initRunAnalysisPage() {
  apiLoadPlateAcqSelect();
  apiLoadAnalysisPipelines();

  new PlateAcqTable({
    tableDivId: 'plate-acq-table-div'
  });

}

function initCellprofilerDevelPage() {
  new PlateAcqTable({
    tableDivId: 'plate-acq-table-div'
  });
}
