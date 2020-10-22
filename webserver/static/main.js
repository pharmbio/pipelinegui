/*
  Javascript version: ECMAScript 6 (Javascript 6)
 */



function apiCreatePlateAcqTable() {

  let limit = 1000;
  let sortOrder = "ASCENDING"

  fetch('/api/list/plate_acquisition/' + limit + "/" + sortOrder)

    .then(function (response) {
      if (response.status === 200) {
        response.json().then(function (json) {

          console.log('result', json);
          drawTable(json['result'], "plate-acq-table-div")

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
          drawTable(json['result'], "jobs-table-div")

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

function drawTable(rows, divname) {

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
  let cols = rows[0];

  for (let col = 0; col < cols.length; col++) {

    let header_cell = document.createElement('td');
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

          reloadAnalysisPipelinesUI();
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


function initIndexPage() {
  console.log("Inside initIndexPage()");
  apiCreatePlateAcqTable();
  apiCreateJobsTable();
}


function initCreateAnalysisPage() {
  console.log("Inside initCreateAnalysisPage()");
  apiLoadAnalysisPipelines();
}

function initRunAnalysisPage() {
  console.log("Inside initRunAnalysisPage()");
  apiLoadPlateAcqSelect();
  apiLoadAnalysisPipelines();
}


