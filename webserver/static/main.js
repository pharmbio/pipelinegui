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

  let limit = 200;

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

  let limit = 200;

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

  let limit = 200;

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


// Notebook link
// http(s)://<server:port>/<lab-location>/lab/tree/path/to/notebook.ipynb

function drawImageAnalysisTable(rows){
  console.log("inside drawImageAnalysisTable, rows", rows)

  // Before drawing table, linkify barcode
  rows = addLinkToBarcodeColumn(rows)

  // Before drawing table, linkify error column
  rows = addLinkToErrorColumn(rows)

  // Before drawing table add ("Controls")
  rows = addControlsColumn(rows)

  // Before drawing table add "Segmentation link" to links column
  rows = addSegmentationLinkColumn(rows)

  // Before drawing table add ("File-Links")
  //rows = addFileLinksColumn(rows)

  // Truncate "result" column
  rows = truncateColumn(rows, "result", 100);

  if (document.getElementById("show-uppmax-cbx") && document.getElementById("show-uppmax-cbx").checked) {
    // leave everything
  }else{
    // filter away uppmax
    rows = filterOutUppmax(rows);
  }

  drawTable(rows, "image_analyses-table-div");

  console.log("done drawImageAnalysisTable")
}



function filterOutUppmax(rows){
  return filterOutFromMeta(rows, 'run-on-uppmax');
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

function addLinkToErrorColumn(rows){

  console.log("Inside addLinkToErrorColumn", rows);

  let cols = rows[0];

  // Define which column is barcode column
  let error_col_index = cols.indexOf("error");
  let id_col_index = cols.indexOf("id");

  let base_url = "https://pipelinegui.k8s-prod.pharmb.io/error-log/";

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

  if (document.getElementById("show-uppmax-cbx") && document.getElementById("show-uppmax-cbx").checked) {
    // leave everything
  }else{
    // filter away uppmax
    rows = filterOutUppmax(rows);
  }

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
      for(var file_path of result.file_list){
        //console.log("file_path", file_path);
        if(file_path.endsWith(".pdf") || file_path.endsWith(".csv")){
          //console.log("file_path", file_path);

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

  let limit = 200;

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
  updateAnalysisPipelinesSelectStandard(selected);
  updateAnalysisPipelinesSelectLatest(selected);
  updateAnalysisPipelinesSelectAll(selected);
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
  var json_text = JSON.parse(preset_text);
  console.log("json_text",json_text)
  let pretty_text = JSON.stringify(json_text, null, 2);

  document.getElementById("edit-meta-input").value = pretty_text;
}




function initIndexPage() {
  console.log("Inside initIndexPage()");
  //apiCreatePlateAcqTable();
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