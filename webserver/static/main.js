/*
  Javascript version: ECMAScript 6 (Javascript 6)
 */
class Table{
  constructor(rows) {
    this.rows = rows;
  }

  getHeaders(){
    return this.rows[0];
  }

  getCell(nRow, columnName){
    for(let n = 0; n < this.getColsCount(); n++){
      if(this.getHeaders()[n] == columnName){
        return this.rows[nRow +1][n]
      }
    }
    return null;
  }

  getCellColIndex(nRow, nCol){
    return this.rows[nRow +1][nCol]
  }

  getRowsCount(){
    return this.rows.length - 1;
  }

  getColsCount(){
    return this.rows[0].length;
  }

}


function apiCreatePlateAcqTable() {

  let limit = 1000;
  let sortOrder = "ASCENDING"

  fetch('/api/list/plate_acquisition/' + limit + "/" + sortOrder)

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
          document.getElementById('logdiv').innerHTML = "<pre>" + json['result'] + "</pre>";
          $("#log-modal").modal();
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
  let sortOrder = "ASCENDING"

  fetch('/api/list/image_analyses/' + limit + "/" + sortOrder)

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
  let sortOrder = "ASCENDING"

  fetch('/api/list/image_sub_analyses/' + limit + "/" + sortOrder)

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

  // Before drawing table add ("Show logs column")

  // Add new column header to end of header row
  let cols = rows[0];
  cols.push("log")

  let name_col_index = cols.indexOf("NAME");

  for (let nRow = 1; nRow < rows.length; nRow++) {

    let job_name = rows[nRow][name_col_index];
    let new_cell_content = "<a href='#' onclick='viewJobLog(\"" + job_name + "\");'>Show log</a>"
    rows[nRow].push(new_cell_content);

  }
  
  drawTable(rows, "jobs-table-div")
}

// Notebook link
// http(s)://<server:port>/<lab-location>/lab/tree/path/to/notebook.ipynb

function drawImageAnalysisTable(rows){

  // Before drawing table, linkify barcode
  rows = addLinkToBarcodeColumn(rows)

  // Before drawing table add ("Controls")
  rows = addControlsColumn(rows)

  // Before drawing table add ("View in notebook")
  rows = addNotebookLinkColumn(rows)

  // Before drawing table add ("File-Links")
  rows = addFileLinksColumn(rows)

  // Truncate "result" column 
  rows = truncateColumn(rows, "result", 100);

  drawTable(rows, "image_analyses-table-div");
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
    console.log("barcode", barcode);

    let link_url = base_url + "barcode=" + encodeURI(barcode)

    let new_contents = "<a target='imagedb' href='" + link_url + "'>" + barcode + "</a>"

    // replace cell
    rows[nRow][barcode_col_index]  = new_contents;
  }

  return rows;

}

function drawImageSubAnalysisTable(rows){

  console.log("Inside drawImageSubAnalysisTable");

  // Truncate "result" column 
  rows = truncateColumn(rows, "result", 100);

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


function addControlsColumn(rows){

  // Add header
  let cols = rows[0];
  cols.splice(0, 0, "Controls");

  // Define which column in result contains the id (-1 because new Controls is inserted in front)
  let id_col_index = cols.indexOf("id") - 1;

  // Create new cell in all rows
  for (let nRow = 1; nRow < rows.length; nRow++) {

    let id = rows[nRow][id_col_index];

    let deleteLink = "<a href='#' onClick='confirmDeleteAnalysis(" + id + ");'>Delete</a>";
    let stopLink = "<a href='#' onClick='confirmStopAnalysis(" + id + ");'>Stop</a>";
    let restartLink = "<a href='#' onClick='confirmRestartAnalysis(" + id + ");'>Restart</a>";
    let new_cell_content = restartLink + "<br>" + deleteLink + "<br>" + stopLink;

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

    console.log("nRow:", nRow);

    let result = rows[nRow][result_col_index];
    console.log("result:)", result);

    let cell_contents = "";

    if(result != null){
      console.log("result.file_list", result.file_list);
      for(var file_path of result.file_list){
        console.log("file_path", file_path);
        if(file_path.endsWith(".pdf") || file_path.endsWith(".csv")){
          console.log("file_path", file_path);

          link_text = basename(file_path);

          let linkified_file_path = "<a href='/" + file_path + "'>" + link_text + "</a>";
          cell_contents += linkified_file_path + ", "
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
    console.log("nRow:", nRow);
    
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

/*
function drawImageAnalysisTable(rows, divname) {

  console.log("rows", rows);
  console.log("divname", divname);

  let container = document.getElementById(divname);

  // Create Table
  let table = document.createElement('table');
  table.id = divname + "-table";
  table.className = 'table';

  // First add header row
  let headerRow = document.createElement('tr');

  // First row in rows is header

  // controlheader
  let extraHeader = document.createElement('th');
  extraHeader.innerHTML = "Controls";
  headerRow.appendChild(extraHeader);

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

    let extraCell = document.createElement('td');
    let id = rows[row][0];
    let deleteLink = "<a href='#' onClick='confirmDeleteAnalysis(" + id + ");'>Delete</a>";
    let stopLink = "<a href='#' onClick='confirmStopAnalysis(" + id + ");'>Stop</a>";
    let restartLink = "<a href='#' onClick='confirmRestartAnalysis(" + id + ");'>Restart</a>";
    extraCell.innerHTML = restartLink + "<br>" + deleteLink + "<br>" + stopLink;
    rowElement.appendChild(extraCell);

    for (let col = 0; col < cols.length; col++) {

      let cell = document.createElement('td');
      cell.innerHTML = rows[row][col];
      //cell.className = 'tableCell';
      rowElement.appendChild(cell);
    }

    table.appendChild(rowElement);
  }

  removeChildren(container);
  container.append(table)

  console.log("drawTable finished")

}
*/

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
      console.log("String match");
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

  let limit = 1000;
  let sortOrder = "ASCENDING"

  fetch('/api/list/plate_acquisition/' + limit + "/" + sortOrder)
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
    console.log("plateAcq", plateAcq)
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

function updateAnalysisPipelinesSelect(selected = "") {

  // This select is not available on all pages, return if not
  let elemSelect = document.getElementById('analysis_pipelines-select');
  if (elemSelect == null) {
    return;
  }

  // reset
  elemSelect.options.length = 0;
  elemSelect.options.selectedIndex = -1;

  // Just loop all elements
  let pipelines = getAnalysisPipelines();
  pipelines.forEach(function (pipeline, index) {
    console.log("pipeline", pipeline)
    elemSelect.options.add(new Option(pipeline['name']));
    // Maybe select option
    if (selected === pipeline['name']) {
      elemSelect.options.selectedIndex = index;
    }
  });
}

/*
function setAnalysisPipelinesSelection(analysisPineline) {
  let elemSelect = document.getElementById('analysis_pipelines-select);
  elemSelect.selectedIndex = getSelectIndexFromSelectValue(elemSelect, protocol);
}
*/

function redrawSelectedAnalysisPipeline() {
  
  let elem = document.getElementById('analysis_pipelines-select');
  let pipelineName = elem.options[elem.selectedIndex].value;
  console.log("pipelineName", pipelineName);
  let pipeline = getAnalysisPipelineFromName(pipelineName);

  console.log("pipeline", pipeline);

  // Update textfield
  document.getElementById('analysis_pipeline-meta').value = JSON.stringify(pipeline['meta'], null, 2);

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

function apiRunAnalysis() {


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


function initIndexPage() {
  console.log("Inside initIndexPage()");
  apiCreatePlateAcqTable();
  apiCreateImageAnalysesTable();
  apiCreateImageSubAnalysesTable();
  apiCreateJobsTable();
}

function initCreateAnalysisPage() {
  console.log("Inside initCreateAnalysisPage()");
  apiLoadAnalysisPipelines();
  apiCreatePipelineFilesTable();
}

function initRunAnalysisPage() {
  console.log("Inside initRunAnalysisPage()");
  apiLoadPlateAcqSelect();
  apiLoadAnalysisPipelines();
  apiCreatePlateAcqTable();
}