function safeParseJSON(raw, fallback){
  try{
    return raw ? JSON.parse(raw) : fallback;
  }catch(e){
    console.error("Failed to parse JSON", e, raw);
    return fallback;
  }
}

    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function() {
        navigator.serviceWorker.register("service-worker.js");
      });
    }
let projects = safeParseJSON(localStorage.getItem("projects3"), []);
let activeProject = localStorage.getItem("activeProject3") || (projects[0] ? projects[0].id : null);
function projectKey(p) { return p.name; }
function keyOfActive() {
  const p = projects.find(x=>x.id===activeProject);
  return p ? projectKey(p) : "";
}
function sidebarSwitchProject() {
  activeProject = document.getElementById("sidebarProjectSel").value;
  localStorage.setItem("activeProject3", activeProject);
  renderProjectSelects();
  loadPointSettings();
  updatePointSelect();
  updateLogTab();
}
function switchTab(tabId) {
  // タブとコンテナ両方のactiveを一度クリア
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".container").forEach(c => c.classList.remove("active"));
  // data-tab属性がtabIdと一致するものをactive
  const tabBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const tabCont = document.getElementById(tabId);
  if(tabBtn) tabBtn.classList.add("active");
  if(tabCont) tabCont.classList.add("active");
  if(tabId === "log") updateLogTab();
  if(tabId === "memo") loadMemo();
}

function addCrossRow() {
  const tbody = document.querySelector("#crossTable tbody");
  const row = tbody.insertRow();
  row.insertCell().innerHTML = `<input type="number" class="mid-input">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input">`;
  row.insertCell().innerHTML = `<input type="text" class="remark-input">`;
}
function initializeCrossTable() {
  const tbody = document.querySelector("#crossTable tbody");
  tbody.innerHTML = "";
  for (let i = 0; i < 10; i++) {
    addCrossRow();
  }
}
function registerCross() {
  if(!activeProject){ alert("工事を選択してください"); return; }
  const point = document.getElementById("pointSel").value.trim();
  const dir = document.getElementById("direction").value; 
  if (!point) return alert("測点を入力してください");
  const rows = document.querySelectorAll("#crossTable tbody tr");
  let rowData = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const values = Array.from(inputs).map(input => input.value.trim());
    if (values.some(v => v)) rowData.push(values);
  });
  let allLogs = safeParseJSON(localStorage.getItem("crossLogs3"), {});
  const k = keyOfActive();
  if(!allLogs[k]) allLogs[k]=[];
  const exists = allLogs[k].some(log => log.point === point && log.dir === dir);
  if(exists){
    alert("既に同じ測点と方向で登録されています");
    return;
  }
  allLogs[k].push({ point, dir, rowData, time: new Date().toLocaleString() });
  localStorage.setItem("crossLogs3", JSON.stringify(allLogs));
  initializeCrossTable();
  document.getElementById("pointSel").value = "";
  updateLogTab();
}
function clearCross() {
  if (confirm("すべての入力内容を削除します。よろしいですか？")) {
    document.getElementById("pointSel").value = "";
    initializeCrossTable();
  }
}

// --- 測点設定 ---
function addPointRow(){
  const tbody = document.querySelector('#pointTable tbody');
  const row = tbody.insertRow();
  row.insertCell().innerHTML =`<input type="text" inputmode="decimal" pattern="[0-9+\\-.]*">`;
  const c1 = row.insertCell();
  c1.innerHTML = `<input type="number" class="mid-input">`;
  const c2 = row.insertCell();
  c2.innerHTML = `<input type="number" class="mid-input">`;
  row.insertCell().innerHTML = `<input type="text">`;

  const tankyoInput = c1.querySelector('input');
  const tsuikyoInput = c2.querySelector('input');
  tankyoInput.addEventListener('input', () => updatePointTable(tankyoInput));
  tsuikyoInput.addEventListener('input', () => updatePointTable(tsuikyoInput));
}
function updatePointTable(changed){
  const rows = document.querySelectorAll('#pointTable tbody tr');
  let prevTsui = 0;
  rows.forEach((row, i) => {
    const inputs = row.querySelectorAll('input');
    const tankyoInput = inputs[1];
    const tsuikyoInput = inputs[2];
    let tankyo = tankyoInput.valueAsNumber;
    let tsuikyo = tsuikyoInput.valueAsNumber;

    // When user clears one field, don't restore previous value
    if(changed === tankyoInput && tankyoInput.value === ''){
      if(tsuikyoInput.value !== '') tsuikyoInput.value = '';
      tankyo = NaN; tsuikyo = NaN;
    } else if(changed === tsuikyoInput && tsuikyoInput.value === ''){
      if(tankyoInput.value !== '') tankyoInput.value = '';
      tankyo = NaN; tsuikyo = NaN;
    } else if(changed === tankyoInput && !isNaN(tankyo)){      const newTsui = (i===0)? tankyo : prevTsui + tankyo;
      const cur = tsuikyoInput.valueAsNumber;
      if(isNaN(cur) || cur !== newTsui) tsuikyoInput.value = newTsui;
      tsuikyo = newTsui;
    } else if(changed === tsuikyoInput && !isNaN(tsuikyo)){
      const newTankyo = tsuikyo - prevTsui;
      const cur = tankyoInput.valueAsNumber;
      if(isNaN(cur) || cur !== newTankyo) tankyoInput.value = newTankyo;
      tankyo = newTankyo;
    } else {
      if(!isNaN(tankyo)){
        const newTsui = (i===0)? tankyo : prevTsui + tankyo;
        const cur = tsuikyoInput.valueAsNumber;
        if(isNaN(cur) || cur !== newTsui) tsuikyoInput.value = newTsui;
        tsuikyo = newTsui;
      } else if(!isNaN(tsuikyo)){
        const newTankyo = tsuikyo - prevTsui;
        const cur = tankyoInput.valueAsNumber;
        if(isNaN(cur) || cur !== newTankyo) tankyoInput.value = newTankyo;
        tankyo = newTankyo;
      } else {
        if(tankyoInput.value !== '') tankyoInput.value = '';
        if(tsuikyoInput.value !== '') tsuikyoInput.value = '';
      }
    }

    prevTsui = !isNaN(tsuikyo) ? tsuikyo : prevTsui;
  });
}
function savePointSettings(){
  if(!activeProject){ alert('工事を選択してください'); return; }
  const rows = document.querySelectorAll('#pointTable tbody tr');
  let data = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const point = inputs[0].value;
    const tankyo = inputs[1].value;
    const tsuikyo = inputs[2].value;
    const note = inputs[3].value;
    if(point || tankyo || tsuikyo || note){
      data.push({point, tankyo, tsuikyo, note});
    }
  });
  let all = safeParseJSON(localStorage.getItem('pointSettings3'), {});
  all[keyOfActive()] = data;
  localStorage.setItem('pointSettings3', JSON.stringify(all));
  updatePointSelect();
}
function loadPointSettings(){
  const tbody = document.querySelector('#pointTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  let all = safeParseJSON(localStorage.getItem('pointSettings3'), {});
  let arr = all[keyOfActive()] || [];
  const rowCount = Math.max(arr.length, 4);
  for(let i=0;i<rowCount;i++) addPointRow();
  arr.forEach((obj,i)=>{
    const inputs = tbody.rows[i].querySelectorAll('input');
    inputs[0].value = obj.point || '';
    inputs[1].value = obj.tankyo || '';
    inputs[2].value = obj.tsuikyo || '';
    inputs[3].value = obj.note || '';
  });
  updatePointTable();
}
function updatePointSelect(){
  const list = document.getElementById('pointList');
  if(!list) return;
  let all = safeParseJSON(localStorage.getItem('pointSettings3'), {});
  let arr = all[keyOfActive()] || [];
  list.innerHTML = '';
  arr.forEach(p=>{ list.innerHTML += `<option value="${p.point}">`; });
}
function addLongRow() {
  const tbody = document.querySelector("#longTable tbody");
  const row = tbody.insertRow();
  row.insertCell().innerHTML = `<input type="number" class="mid-input">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input">`;
  let c2 = row.insertCell();
  c2.classList.add('readonly-cell');
  c2.innerHTML = `<input type="number" class="mid-input" readonly tabindex="-1">`;
  row.insertCell().innerHTML = `<input type="number" class="narrow-input">`;
  row.insertCell().innerHTML = `<input type="number" class="narrow-input">`;
  let c5 = row.insertCell();
  c5.classList.add('readonly-cell');
  c5.innerHTML = `<input type="number" class="narrow-input" readonly tabindex="-1">`;
  let c6 = row.insertCell();
  c6.classList.add('readonly-cell');
  c6.innerHTML = `<input type="number" class="wide-input" readonly tabindex="-1">`;
  const inputs = row.querySelectorAll("input");
  inputs[1].addEventListener("input", () => calculateLong());
  inputs[3].addEventListener("input", () => {
    if(inputs[3].value !== ""){
      inputs[4].value = "";
      inputs[4].setAttribute("readonly", true);
      inputs[4].parentElement.classList.add('readonly-cell');
    }else{
      inputs[4].removeAttribute("readonly");
      inputs[4].parentElement.classList.remove('readonly-cell');
    }
    calculateLong();
  });
  inputs[4].addEventListener("input", () => {
    if(inputs[4].value !== ""){
      inputs[3].value = "";
      inputs[3].setAttribute("readonly", true);
      inputs[3].parentElement.classList.add('readonly-cell');
    }else{
      inputs[3].removeAttribute("readonly");
      inputs[3].parentElement.classList.remove('readonly-cell');
    }
    calculateLong();
  });
}
function calculateLong() {
  const rows = document.querySelectorAll("#longTable tbody tr");
  let prevGH = null, prevDelta = null, prevTsui = 0;
  rows.forEach((row, i) => {
    const cells = row.querySelectorAll("input");
    const tankyo = parseFloat(cells[1].value) || 0;
    let tsui = (i === 0) ? tankyo : (prevTsui + tankyo);
    cells[2].value = tankyo === 0 ? "" : tsui;
    prevTsui = tsui;
    const bs = parseFloat(cells[3].value);
    const fs = parseFloat(cells[4].value);
    if (cells[3].value !== "") {
      cells[4].value = "";
      cells[4].setAttribute("readonly", true);
      cells[4].parentElement.classList.add('readonly-cell');
    } else {
      cells[4].removeAttribute("readonly");
      cells[4].parentElement.classList.remove('readonly-cell');
    }
    if (cells[4].value !== "") {
      cells[3].value = "";
      cells[3].setAttribute("readonly", true);
      cells[3].parentElement.classList.add('readonly-cell');
    } else {
      cells[3].removeAttribute("readonly");
      cells[3].parentElement.classList.remove('readonly-cell');
    }
    if (i === 0) {
      if (!cells[6].value) {
        let gh = prompt("初期GHを入力してください", "");
        if (gh === null || gh.trim() === "" || isNaN(parseFloat(gh))) return;
        cells[6].value = parseFloat(gh).toFixed(2);
      }
      prevGH = parseFloat(cells[6].value);
      let delta = prevGH;
      if (!isNaN(bs)) { delta = prevGH + bs; }
      cells[5].value = delta.toFixed(2);
      prevDelta = delta;
    } else {
      let prevRow = rows[i-1];
      let prevGHfromRow = parseFloat(prevRow.querySelectorAll("input")[6].value);
      let delta = prevDelta;
      if (!isNaN(bs) && !isNaN(prevGHfromRow)) {
        delta = prevGHfromRow + bs;
      }
      cells[5].value = delta !== null ? delta.toFixed(2) : "";
      if (!isNaN(fs) && delta !== null) {
        let gh = delta - fs;
        cells[6].value = gh.toFixed(2);
        prevGH = gh; prevDelta = delta;
      } else {
        cells[6].value = "";
        prevGH = delta; prevDelta = delta;
      }
    }
  });
}
function registerLong() {
  if(!activeProject){ alert("工事を選択してください"); return; }
  const rows = document.querySelectorAll("#longTable tbody tr");
  let allLogs = safeParseJSON(localStorage.getItem("longLogs3"), {});
  let tableRows = [];
  rows.forEach(row => {
    const inputs = row.querySelectorAll("input");
    const point = inputs[0].value;
    const tankyo = inputs[1].value;
    const tsuikyo = inputs[2].value;
    const bs = inputs[3].value;
    const fs = inputs[4].value;
    const delta = inputs[5].value;
    const gh = inputs[6].value;
    if (point || tankyo || tsuikyo || bs || fs || delta || gh) {
      tableRows.push({ point, tankyo, tsuikyo, bs, fs, delta, gh });
    }
  });
  if (tableRows.length > 0) {
    const k = keyOfActive();
    if(!allLogs[k]) allLogs[k]=[];
    // check for duplicate based on identical row contents
    const exists = allLogs[k].some(log => JSON.stringify(log.tableRows) === JSON.stringify(tableRows));
    if(exists){
      alert("既に同じ内容が登録されています");
      return;
    }
    allLogs[k].push({ tableRows, time: new Date().toLocaleString() });
    localStorage.setItem("longLogs3", JSON.stringify(allLogs));
  }
  updateLogTab();
  clearLongTable();
}
function clearLongTable() {
  document.querySelector("#longTable tbody").innerHTML = "";
  for (let i = 0; i < 10; i++) addLongRow();
}
function clearLong() {
  if (confirm("縦断測量のすべてのデータを削除します。よろしいですか？")) {
    clearLongTable();
  }
}
function addPavementRow() {
  const tbody = document.querySelector('#pavementTable tbody');
  const row = tbody.insertRow();
  // 順番を「舗装種類｜測点｜単距｜追距｜幅員｜平均幅員｜面積」にする
  row.insertCell().innerHTML = `
    <select onchange="propagatePavementType(this)">
      <option value="アスファルト">アスファルト</option>
      <option value="コンクリート">コンクリート</option>
      <option value="オーバーレイ">オーバーレイ</option>
    </select>
  `;
  row.insertCell().innerHTML =  `<input type="number" oninput="updatePavementTable()">`;    // 測点
  row.insertCell().innerHTML = `<input type="number" oninput="updatePavementTable()">`; // 単距
  let c2 = row.insertCell();
  c2.classList.add('readonly-cell');
  c2.innerHTML = `<input type="number" readonly tabindex="-1">`;         // 追距
  row.insertCell().innerHTML = `<input type="number" oninput="updatePavementTable()">`; // 幅員
  let c4 = row.insertCell();
  c4.classList.add('readonly-cell');
  c4.innerHTML = `<input type="number" readonly tabindex="-1">`;         // 平均幅員
  let c5 = row.insertCell();
  c5.classList.add('readonly-cell');
  c5.innerHTML = `<input type="number" readonly tabindex="-1">`;         // 面積
  updatePavementTable();
}
  function propagatePavementType(sel){
  const rows = document.querySelectorAll("#pavementTable tbody tr");
  const currentRow = sel.closest("tr");
  const index = Array.from(rows).indexOf(currentRow);
  for(let i=index+1;i<rows.length;i++){
    const s = rows[i].querySelector("select");
    if(s) s.value = sel.value;
  }
  updatePavementTable();
}

function updatePavementTable() {
  const rows = document.querySelectorAll('#pavementTable tbody tr');
  let prevTsuikyo = 0, prevHani = 0, areaTotal = 0;
  let areaMap = { 'アスファルト':0, 'コンクリート':0, 'オーバーレイ':0 };
  rows.forEach((row, i) => {
    const select = row.querySelector('select');
    const inputs = row.querySelectorAll('input');
    // 順番：[測点, 単距, 追距, 幅員, 平均幅員, 面積]
    const tankyo = parseFloat(inputs[1].value) || 0;  // 単距
    let tsuikyo = (i === 0) ? tankyo : (prevTsuikyo + tankyo);
    inputs[2].value = tankyo ? tsuikyo : '';          // 追距
    prevTsuikyo = tsuikyo;

    const hani = parseFloat(inputs[3].value) || 0;    // 幅員
    let avgHani = (i === 0) ? hani : ((hani + prevHani) / 2);
    inputs[4].value = hani ? avgHani.toFixed(2) : ''; // 平均幅員
    prevHani = hani;

    let area = (tankyo && avgHani) ? (tankyo * avgHani) : '';
    inputs[5].value = area ? area.toFixed(2) : '';    // 面積
    areaTotal += parseFloat(inputs[5].value) || 0;
    if(area){
      areaMap[select.value] += parseFloat(area);
    }
  });
  document.getElementById('areaTotalCell').textContent = areaTotal.toFixed(2);
  document.getElementById('asphaltAreaCell').textContent = areaMap['アスファルト'].toFixed(2);
  document.getElementById('concreteAreaCell').textContent = areaMap['コンクリート'].toFixed(2);
  document.getElementById('overlayAreaCell').textContent = areaMap['オーバーレイ'].toFixed(2);
}
function clearPavementTable() {
  document.querySelector('#pavementTable tbody').innerHTML = '';
  for(let i=0;i<10;i++) addPavementRow();
  updatePavementTable();

}
function clearPavement() {
  if (confirm("舗装計算のすべてのデータを削除します。よろしいですか？")) {
    clearPavementTable();
  }
}
function registerPavement() {
  if(!activeProject){ alert("工事を選択してください"); return; }
  const rows = document.querySelectorAll("#pavementTable tbody tr");
  let pavementLogs = safeParseJSON(localStorage.getItem("pavementLogs3"), {});
  let tableRows = [];
  let areaMap = { 'アスファルト':0, 'コンクリート':0, 'オーバーレイ':0 };
  rows.forEach(row => {
    const select = row.querySelector('select');
    const inputs = row.querySelectorAll('input');
    const type = select.value;
    const point   = inputs[0].value;
    const tankyo  = inputs[1].value;
    const tsuikyo = inputs[2].value;
    const hani    = inputs[3].value;
    const avgHani = inputs[4].value;
    const area    = inputs[5].value;
    if(type || point || tankyo || tsuikyo || hani || avgHani || area){
      tableRows.push({type, point, tankyo, tsuikyo, hani, avgHani, area});
      areaMap[type] += parseFloat(area) || 0;
    }
  });
  let areaTotal = document.getElementById('areaTotalCell').textContent;
  if (tableRows.length > 0) {
    const k = keyOfActive();
    if(!pavementLogs[k]) pavementLogs[k]=[];
    pavementLogs[k].push({ tableRows, areaTotal, areaMap, time: new Date().toLocaleString() });
    localStorage.setItem("pavementLogs3", JSON.stringify(pavementLogs));
  }
  updateLogTab();
  clearPavementTable();
}
function exportPavementExcel() {
  updatePavementTable();
  const rows = document.querySelectorAll('#pavementTable tbody tr');
  let csv = '舗装種類,測点,単距,追距,幅員,平均幅員,面積\n';
  rows.forEach(row => {
    const sel = row.querySelector('select').value;
    const inputs = row.querySelectorAll('input');
    const vals = [inputs[0].value, inputs[1].value, inputs[2].value, inputs[3].value, inputs[4].value, inputs[5].value];
    if(sel || vals.some(v => v)) {
      csv += [sel, ...vals].join(',') + '\n';
    }
  });
  const asphalt = document.getElementById('asphaltAreaCell').textContent;
  const concrete = document.getElementById('concreteAreaCell').textContent;
  const overlay = document.getElementById('overlayAreaCell').textContent;
  const total = document.getElementById('areaTotalCell').textContent;
  csv += `アスファルト計,,,,,,${asphalt}\n`;
  csv += `コンクリート計,,,,,,${concrete}\n`;
  csv += `オーバーレイ計,,,,,,${overlay}\n`;
  csv += `合計,,,,,,${total}\n`;
  const blob = new Blob(['\uFEFF' + csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pavement.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- 土方カーブ計算 ---
function addMassRow() {
  const tbody = document.querySelector('#massTable tbody');
  const row = tbody.insertRow();
  row.insertCell().innerHTML = `<input type="number" class="mid-input">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input" oninput="updateMassTable()">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input" oninput="updateMassTable()">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input" readonly tabindex="-1">`;
  row.insertCell().innerHTML = `<input type="number" class="mid-input" readonly tabindex="-1">`;
  updateMassTable();
}
function updateMassTable() {
  const rows = document.querySelectorAll('#massTable tbody tr');
  let cum = 0;
  rows.forEach((row,i)=>{
    const inputs = row.querySelectorAll('input');
    inputs[3].value = ''; inputs[4].value = '';
    if(i===0) return;
    const prev = rows[i-1].querySelectorAll('input');
    const st = parseFloat(inputs[0].value);
    const pst = parseFloat(prev[0].value);
    if(isNaN(st) || isNaN(pst)) return;
    const dist = st - pst;
    const cut1 = parseFloat(prev[1].value)||0;
    const fill1 = parseFloat(prev[2].value)||0;
    const cut2 = parseFloat(inputs[1].value)||0;
    const fill2 = parseFloat(inputs[2].value)||0;
    const net1 = fill1 - cut1;
    const net2 = fill2 - cut2;
    const interval = (net1 + net2)/2 * dist;
    cum += interval;
    inputs[3].value = interval.toFixed(2);
    inputs[4].value = cum.toFixed(2);
  });
}
function clearMassTable(){
  document.querySelector('#massTable tbody').innerHTML='';
  for(let i=0;i<10;i++) addMassRow();
}
function clearMass(){
  if(confirm('土方カーブのすべてのデータを削除します。よろしいですか？')){
    clearMassTable();
}
}
function registerMass(){
  if(!activeProject){ alert('工事を選択してください'); return; }
  const rows = document.querySelectorAll('#massTable tbody tr');
  let massLogs = safeParseJSON(localStorage.getItem('massLogs3'), {});
  let tableRows = [];
  rows.forEach(row=>{
    const inputs = row.querySelectorAll('input');
    const station = inputs[0].value;
    const cut = inputs[1].value;
    const fill = inputs[2].value;
    const interval = inputs[3].value;
    const cumulative = inputs[4].value;
    if(station || cut || fill || interval || cumulative){
      tableRows.push({station, cut, fill, interval, cumulative});
    }
  });
  if(tableRows.length>0){
    const k = keyOfActive();
    if(!massLogs[k]) massLogs[k]=[];
    massLogs[k].push({tableRows, time: new Date().toLocaleString()});
    localStorage.setItem('massLogs3', JSON.stringify(massLogs));
  }
  updateLogTab();
}

function calculateMassChord(){
  const c = parseFloat(document.getElementById('massChordC').value);
  const r = parseFloat(document.getElementById('massChordR').value);
  if(isNaN(c) || isNaN(r) || r === 0){
    document.getElementById('massChordResult').textContent = '数値を確認してください';
    return;
  }
  // 本式
  // 中央縦距M1（C/2地点）・1/4点縦距M2（C/4地点）
  const m1 = r - Math.sqrt(r*r - Math.pow(c/2,2));
  const m2 = r - Math.sqrt(r*r - Math.pow(c/4,2));
  document.getElementById('massChordResult').innerHTML = `
    <table class="survey-table">
      <tr><th>中央縦距M1</th><th>1/4点縦距M2</th></tr>
    <tr><td>${m1.toFixed(3)}</td><td>${m2.toFixed(3)}</td></tr>
    </table>`;
}

function calculateVCurve(){
  const ip   = parseFloat(document.getElementById('vcIP').value);
  const g1p  = parseFloat(document.getElementById('vcG1').value);
  const g2p  = parseFloat(document.getElementById('vcG2').value);
  const vcl  = parseFloat(document.getElementById('vcVCL').value);
  const gh0  = parseFloat(document.getElementById('vcGH0').value);
  const out  = document.getElementById('vcurveResult');
  if([ip,g1p,g2p,vcl,gh0].some(x=>isNaN(x)) || vcl===0 || g1p===g2p){
    out.textContent = '数値を確認してください';
    return;
  }
  const g1 = g1p/100; const g2 = g2p/100;
  const start = ip - vcl/2;
  const a = (g1 - g2) / (2*vcl);
  let html = '';
  const xm = (g1 * vcl)/(g1 - g2);
  const minSt = start + xm;
  const ghm = gh0 + g1*xm - a*xm*xm;
  const vcr = vcl / (g1 - g2);
  const label = (g1 - g2) > 0 ? '最高地点' : '最低地点';
  html += `${label}：${minSt.toFixed(2)}m GH：${ghm.toFixed(2)}<br>`;
  html += `VCR：${vcr.toFixed(2)}<br>`;  html += '<table class="survey-table"><tr><th>測点</th><th>GH</th><th>y</th><th>⊿</th></tr>';
  const xs = [];
  for(let i=0;i<=Math.floor(vcl);i++) xs.push(i);
  const ipOffset = vcl/2;
  if(!xs.some(x=>Math.abs(x-ipOffset)<1e-9)) xs.push(ipOffset);
  if(!xs.some(x=>Math.abs(x-vcl)<1e-9)) xs.push(vcl);
  xs.sort((a,b)=>a-b);
  let prev = null;
  xs.forEach(x => {
    const st = start + x;
    const y = Math.abs(a) * x * x;
    const gh = gh0 + g1*x + (a < 0 ? y : -y);
    let d = '—';
    if(prev!==null){
      const diff = gh - prev;
      d = (diff>=0?'+':'') + diff.toFixed(2);
    }
    let label = '';
    if(Math.abs(x) < 1e-9){
      label = '(始点)';
    } else if(Math.abs(x - ipOffset) < 0.01){
      label = '(IP点)';
    } else if(Math.abs(x - vcl) < 0.01){
      label = '(終点)';
    }
    html += `<tr><td>${st.toFixed(2)}${label}</td><td>${gh.toFixed(2)}</td><td>${y.toFixed(2)}</td><td>${d}</td></tr>`;
    prev = gh;
  });
  html += '</table>';
  out.innerHTML = html;
}

function crossRowText(rows){
  return rows.map(r => {
    const h = r[0];
    const v = r[1];
    const note = r[2];
    let txt = "";
    if(h && v){
      txt = `${h}/${v}`;
    }else if(h){
      txt = `${h}/L`;
    }else if(v){
      txt = `${v}`;
    }else if(note){
      // 横・縦が空でも備考がある場合は備考のみ返す
      return note;
    }else{
      return "";
    }
    if(note) txt += `(${note})`;
    return txt;
  }).filter(Boolean).join(" ");
}

function updateLogTab(){
  const prjId = document.getElementById("logProjectSel").value;
  const p = projects.find(x=>x.id===prjId);
  const k = p ? projectKey(p) : "";
  const crossLogs = safeParseJSON(localStorage.getItem("crossLogs3"), {});
  let logsArr = crossLogs[k] || [];
  let htmlCross = `<h3>横断測量</h3><hr>`;
  logsArr.forEach(log => {
    const text = crossRowText(log.rowData);
    htmlCross += `<div class="section"><b>測点 ${log.point} ${log.dir}</b> ${text}</div>`;
  });
  document.getElementById("logCross").innerHTML = htmlCross;
  const longLogs = safeParseJSON(localStorage.getItem("longLogs3"), {});
  let lArr = longLogs[k] || [];
  let htmlLong = `<h3>縦断測量</h3><hr>`;
  lArr.forEach(log => {
    htmlLong += `<div class="section"><table class="survey-table"><tr>
      <th>測点</th><th>単距</th><th>追距</th><th>BS</th><th>FS</th><th>⊿</th><th>GH</th>
      </tr>`;
    log.tableRows.forEach(row => {
      htmlLong += `<tr>
        <td>${row.point}</td>
        <td>${row.tankyo}</td>
        <td>${row.tsuikyo}</td>
        <td>${row.bs}</td>
        <td>${row.fs}</td>
        <td>${row.delta}</td>
        <td>${row.gh}</td>
      </tr>`;
    });
    htmlLong += `</table></div>`;
  });
  document.getElementById("logLong").innerHTML = htmlLong;
  const pavementLogs = safeParseJSON(localStorage.getItem("pavementLogs3"), {});
  let pArr = pavementLogs[k] || [];
  let htmlPave = `<h3>舗装計算</h3><hr>`;
  pArr.forEach(log => {
    htmlPave += `<div class="section"><table class="survey-table"><tr>
      <th>舗装種類</th><th>測点</th><th>幅員</th><th>単距</th><th>追距</th><th>平均幅員</th><th>面積</th>
      </tr>`;
    log.tableRows.forEach(row => {
      htmlPave += `<tr>
        <td>${row.type}</td>
        <td>${row.point}</td>
        <td>${row.hani}</td>
        <td>${row.tankyo}</td>
        <td>${row.tsuikyo}</td>
        <td>${row.avgHani}</td>
        <td>${row.area}</td>
      </tr>`;
    });
    htmlPave += `<tr>
        <td colspan="6" style="text-align:right;">アスファルト計</td>
        <td>${(log.areaMap && log.areaMap['アスファルト'] ? parseFloat(log.areaMap['アスファルト']).toFixed(2) : '0.00')}</td>
      </tr>`;
    htmlPave += `<tr>
        <td colspan="6" style="text-align:right;">コンクリート計</td>
        <td>${(log.areaMap && log.areaMap['コンクリート'] ? parseFloat(log.areaMap['コンクリート']).toFixed(2) : '0.00')}</td>
      </tr>`;
    htmlPave += `<tr>
        <td colspan="6" style="text-align:right;">オーバーレイ計</td>
        <td>${(log.areaMap && log.areaMap['オーバーレイ'] ? parseFloat(log.areaMap['オーバーレイ']).toFixed(2) : '0.00')}</td>
      </tr>`;
    htmlPave += `<tr>
        <td colspan="6" style="text-align:right;">合計</td>
        <td>${log.areaTotal}</td>
      </tr>`;
    htmlPave += `</table>日時:${log.time}</div>`;
  });
  document.getElementById("logPavement").innerHTML = htmlPave;
  const curveLogs = safeParseJSON(localStorage.getItem("curveLogs3"), {});
  let cArr = curveLogs[k] || [];
  let htmlCurve = `<h3>道路曲線計算</h3><hr>`;
  cArr.forEach(log => {
    htmlCurve += `<div class="section"><table class="survey-table">
      <tr><th>IP No</th><th>IA</th><th>R</th><th>TL</th><th>SL</th><th>CL</th><th>CL/2</th><th>MC</th></tr>
      <tr>
        <td>${log.ipNo || ""}</td>
        <td>${log.iaStr || ""}</td>
        <td>${log.r || ""}</td>
        <td>${log.tl || ""}</td>
        <td>${log.sl || ""}</td>
        <td>${log.cl || ""}</td>
        <td>${log.cl2 || ""}</td>
        <td>${log.mc || ""}</td>
      </tr>
    </table></div>`;
  });
  document.getElementById("logCurve").innerHTML = htmlCurve;
  const massLogs = safeParseJSON(localStorage.getItem("massLogs3"), {});
  let mArr = massLogs[k] || [];
  let htmlMass = `<h3>土方カーブ</h3><hr>`;
  mArr.forEach(log => {
    htmlMass += `<div class="section"><table class="survey-table"><tr><th>測点</th><th>切土面積</th><th>盛土面積</th><th>区間体積</th><th>累計体積</th></tr>`;
    log.tableRows.forEach(r => {
      htmlMass += `<tr><td>${r.station}</td><td>${r.cut}</td><td>${r.fill}</td><td>${r.interval}</td><td>${r.cumulative}</td></tr>`;
    });
    htmlMass += `</table>日時:${log.time}</div>`;
  });
  document.getElementById("logMass").innerHTML = htmlMass;
  const allMemos = safeParseJSON(localStorage.getItem("memoLogs3"), {});
  let memo = allMemos[k] || "";
  document.getElementById("logMemo").innerHTML = `<h3>現場メモ</h3><div class="section">${memo.replace(/\n/g,"<br>")}</div>`;
}
function clearCategory(cat) {
  const prjId = document.getElementById("logProjectSel").value;
  const p = projects.find(x=>x.id===prjId);
  if(!p) return;
  const k = projectKey(p);
  let keyMap = {cross: "crossLogs3", long: "longLogs3", pavement: "pavementLogs3", curve: "curveLogs3", mass: "massLogs3", memo: "memoLogs3"};
  if(!keyMap[cat]) return;
  if(!confirm("本当にこの工事の「"+{cross:"横断測量",long:"縦断測量",pavement:"舗装計算",curve:"道路曲線計算",mass:"土方カーブ",memo:"メモ"}[cat]+"」記録を削除しますか？")) return;
  let all = safeParseJSON(localStorage.getItem(keyMap[cat]), {});
  if(all[k]) delete all[k];
  localStorage.setItem(keyMap[cat], JSON.stringify(all));
  updateLogTab();
}
function addProject() {
  const name = document.getElementById('projectName').value.trim();
  if(!name) return alert("工事名を入力してください");
  if(projects.some(x=>x.name === name)) return alert("同じ工事名は登録できません");
  const id = Date.now().toString();
  projects.push({id, name});
  localStorage.setItem("projects3", JSON.stringify(projects));
  activeProject = id;
  localStorage.setItem("activeProject3", activeProject);
  renderProjectSelects();
  loadPointSettings();
  updatePointSelect();
  alert("工事を追加・切替しました");
}
function renderProjectSelects() {
  const sbs = document.getElementById("sidebarProjectSel");
  const lgs = document.getElementById("logProjectSel");
  sbs.innerHTML = lgs.innerHTML = "";
  projects.forEach(p => {
    const sel = `<option value="${p.id}" ${p.id===activeProject?"selected":""}>${p.name}</option>`;
    sbs.innerHTML += sel; lgs.innerHTML += sel;
  });
  let txt = "";
  projects.forEach((p,i) => {
    txt += `・${i+1}（${p.name}）<br>`;
  });
  document.getElementById("prjList").innerHTML = txt;
  loadPointSettings();
  updatePointSelect();
}
function deleteProject() {
  if(!activeProject) return;
  const p = projects.find(x=>x.id===activeProject);
  if(!p) return;
  if(!confirm("この工事（"+p.name+"）と記録を完全削除します。よろしいですか？")) return;
  projects = projects.filter(x=>x.id !== activeProject);
  localStorage.setItem("projects3", JSON.stringify(projects));
  const k = projectKey(p);
  ["crossLogs3", "longLogs3", "pavementLogs3", "curveLogs3", "massLogs3", "memoLogs3"].forEach(key=>{
    let all = safeParseJSON(localStorage.getItem(key), {});
    if(all[k]) delete all[k];
    localStorage.setItem(key, JSON.stringify(all));
  });
  activeProject = projects[0] ? projects[0].id : null;
  localStorage.setItem("activeProject3", activeProject);
  renderProjectSelects();
  loadPointSettings();
  updatePointSelect();
  updateLogTab();
}
function clearAllProjects() {
  if(!confirm("すべての工事設定および記録を完全削除します。よろしいですか？")) return;
  localStorage.removeItem("projects3");
  localStorage.removeItem("activeProject3");
  ["crossLogs3", "longLogs3", "pavementLogs3", "curveLogs3", "massLogs3", "memoLogs3"].forEach(k=>localStorage.removeItem(k));
  projects = [];
  activeProject = null;
  renderProjectSelects();
  loadPointSettings();
  updatePointSelect();
  updateLogTab();
}
function saveMemo() {
  if(!activeProject){ alert("工事を選択してください"); return; }
  const memo = document.getElementById("memoText").value.trim();
  if(!memo) return;

  let allMemos = safeParseJSON(localStorage.getItem("memoLogs3"), {});
  const k = keyOfActive();
  if(allMemos[k]) allMemos[k] += "\n" + memo; else allMemos[k] = memo;
  localStorage.setItem("memoLogs3", JSON.stringify(allMemos));
  document.getElementById("memoText").value = "";
  document.getElementById("memoSaved").textContent = "保存しました";
  updateLogTab();
}
function loadMemo() {
  document.getElementById("memoText").value = "";
  document.getElementById("memoSaved").textContent = "";
}
window.onload = () => {
  renderProjectSelects();
  initializeCrossTable();
  clearLongTable();
  clearPavementTable();
  updateLogTab();
  switchTab('project');
};
// --- 図形タブ（簡易お絵描き＋数字/テキスト） --- //
let drawMode = "line";
let drawing = false;
let startX, startY;
let canvas, ctx;
let drawObjects = [];
let freehandPoints = [];
let scale = 100; // pixels per meter
let currentX = null, currentY = null;
let savedDrawings = safeParseJSON(localStorage.getItem("drawingLogs3"), {});
let inputsInitialized = false;
let redoStack = [];

function setDrawMode(mode) {
  drawMode = mode;
  drawing = false;
  document.querySelectorAll('.draw-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === mode);
  });  const labels = { line: '線', text: 'テキスト', number: '数字', freehand: 'フリーハンド' };
  document.getElementById("drawModeLabel").textContent = `モード: ${labels[mode] || mode}`;
  const controls = document.querySelector('.draw-controls');
  if (controls) controls.style.display = (mode === 'line') ? 'flex' : 'none';
  console.log('drawMode set to', drawMode);
}
function getCanvasCtx() {
  if (!canvas) {
    canvas = document.getElementById("drawingCanvas");
    ctx = canvas.getContext("2d");
  }
}
function clearCanvas() {
  getCanvasCtx();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function clearDrawing(){
  drawObjects = [];
  clearCanvas();
  currentX = null;
  currentY = null;
  redoStack = [];
}
function undoDrawing(){
  if(drawObjects.length===0) return;
  const obj = drawObjects.pop();
  redoStack.push(obj);
  redraw();
}
function redoDrawing(){
  if(redoStack.length===0) return;
  const obj = redoStack.pop();
  drawObjects.push(obj);
  redraw();
}
function drawMarker(x,y){
  ctx.beginPath();
  ctx.arc(x,y,4,0,Math.PI*2);
  ctx.fillStyle='#ff4444';
  ctx.fill();
}
function redraw(){
  clearCanvas();
  drawObjects.forEach(obj=>{
    if(obj.type==='line'){
      ctx.beginPath();
      ctx.moveTo(obj.x1, obj.y1);
      ctx.lineTo(obj.x2, obj.y2);
      ctx.strokeStyle="#1c1c1c"; ctx.lineWidth=2;
      ctx.stroke();
      drawMarker(obj.x1,obj.y1);
      drawMarker(obj.x2,obj.y2);
      drawMarker((obj.x1+obj.x2)/2,(obj.y1+obj.y2)/2);
    }else if(obj.type==='text'){
      ctx.font="20px sans-serif";
      ctx.fillStyle="#ca6b00";
      ctx.fillText(obj.text, obj.x, obj.y);
      }else if(obj.type==='freehand'){
      if(obj.points.length>1){
        ctx.beginPath();
        ctx.moveTo(obj.points[0].x, obj.points[0].y);
        for(let i=1;i<obj.points.length;i++){
          ctx.lineTo(obj.points[i].x, obj.points[i].y);
        }
        ctx.strokeStyle="#1c1c1c";
        ctx.lineWidth=2;
        ctx.stroke();
      }
    }
  });
}
function ensureCurrentPoint(){
  getCanvasCtx();
  if(currentX===null || currentY===null){
    currentX = canvas.width/2;
    currentY = canvas.height/2;
  }
}
function addRelativeLine(){
  ensureCurrentPoint();
  const dxRaw = document.getElementById('inputDX').value;
  const dyRaw = document.getElementById('inputDY').value;
  const dx = parseFloat(dxRaw);
  const dy = parseFloat(dyRaw);
  if(isNaN(dx) && isNaN(dy)){
    alert('xまたはyを入力してください');
    return;
  }
  const x1 = currentX;
  const y1 = currentY;
  const x2 = x1 + (isNaN(dx)?0:dx) * scale;
  const y2 = y1 - (isNaN(dy)?0:dy) * scale;
  drawObjects.push({type:'line', x1, y1, x2, y2});
  redoStack = [];
  currentX = x2;
  currentY = y2;
  document.getElementById('inputDX').value = '';
  document.getElementById('inputDY').value = '';
  redraw();
}

function addAxisLine(axis,val){
  if(isNaN(val)) return;
  ensureCurrentPoint();
  const x1 = currentX;
  const y1 = currentY;
  const dx = axis==='x' ? val*scale : 0;
  const dy = axis==='y' ? val*scale : 0;
  const x2 = x1 + dx;
  const y2 = y1 - dy;
  drawObjects.push({type:'line', x1, y1, x2, y2});
  redoStack = [];
  currentX = x2;
  currentY = y2;
  redraw();
}
function distToSegment(px,py,x1,y1,x2,y2){
  const A=px-x1, B=py-y1, C=x2-x1, D=y2-y1;
  const dot=A*C+B*D;
  const lenSq=C*C+D*D;
  let param= lenSq? dot/lenSq : -1;
  let xx,yy;
  if(param<0){ xx=x1; yy=y1; }
  else if(param>1){ xx=x2; yy=y2; }
  else{ xx=x1+param*C; yy=y1+param*D; }
  const dx=px-xx, dy=py-yy;
  return Math.sqrt(dx*dx+dy*dy);
}
function findObjectAt(x,y){
  getCanvasCtx();
  for(let i=drawObjects.length-1;i>=0;i--){
    const obj=drawObjects[i];
    if(obj.type==='line'){
      const handles=[
        {x:obj.x1,y:obj.y1},
        {x:obj.x2,y:obj.y2},
        {x:(obj.x1+obj.x2)/2,y:(obj.y1+obj.y2)/2}
      ];
      for(const h of handles){
        if(Math.hypot(x-h.x,y-h.y)<=8) return obj;
      }
      if(distToSegment(x,y,obj.x1,obj.y1,obj.x2,obj.y2)<=6) return obj;
    }else if(obj.type==='text'){
      ctx.font="20px sans-serif";
      const w=ctx.measureText(obj.text).width;
      const h=20;
      if(x>=obj.x && x<=obj.x+w && y<=obj.y && y>=obj.y-h) return obj;
      }else if(obj.type==='freehand'){
      for(let j=0;j<obj.points.length-1;j++){
        const p1=obj.points[j], p2=obj.points[j+1];
        if(distToSegment(x,y,p1.x,p1.y,p2.x,p2.y)<=6) return obj;
      }
    }
  }
  return null;
}
function saveDrawing() {
  getCanvasCtx();
  if(!activeProject){ alert("工事を選択してください"); return; }
  const k = keyOfActive();
  // PNG形式で保存
  let img = canvas.toDataURL("image/png");
  if(!savedDrawings[k]) savedDrawings[k]=[];
  savedDrawings[k].push({img, time: new Date().toLocaleString()});
  localStorage.setItem("drawingLogs3", JSON.stringify(savedDrawings));
  showDrawingLog();
  clearDrawing();
  alert("記録しました");
}
function showDrawingLog() {
  if(!activeProject) return;
  const k = keyOfActive();
  let arr = savedDrawings[k] || [];
  let html = `<h3>図形記録</h3>`;
  arr.forEach(obj => {
    html += `<div style="margin-bottom:8px;"><img src="${obj.img}" style="width:120px;border:1px solid #999;"><br><small>${obj.time}</small></div>`;
  });
  document.getElementById("drawingLog").innerHTML = html;
}

// --- キャンバス描画イベント処理 ---
function setupDrawingCanvas() {
  getCanvasCtx();
  if(!inputsInitialized){
    const dxEl = document.getElementById('inputDX');
    const dyEl = document.getElementById('inputDY');
    const handleX = e => { if(e.type==='keydown' && e.key!=='Enter') return; addAxisLine('x', parseFloat(dxEl.value)); dxEl.value=''; };
    const handleY = e => { if(e.type==='keydown' && e.key!=='Enter') return; addAxisLine('y', parseFloat(dyEl.value)); dyEl.value=''; };
    dxEl.addEventListener('keydown', handleX);
    dyEl.addEventListener('keydown', handleY);
    inputsInitialized = true;
  }
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  function xy(e) {
    const rect = canvas.getBoundingClientRect();

    if(e.touches){ // タッチ端末
      let t = e.touches[0] || e.changedTouches[0];
      return {x: t.clientX - rect.left, y: t.clientY - rect.top};
    }else{
      return {x: e.clientX - rect.left, y: e.clientY - rect.top};
    }
  }
  canvas.onmousedown = function(e){
    let pos = xy(e);
    if(drawMode==='freehand'){
      drawing = true;
      freehandPoints = [{x: pos.x, y: pos.y}];
      console.log('freehand start', freehandPoints[0]);
    }
  };
  canvas.onmousemove = function(e){
    let pos = xy(e);
    if(drawMode==='freehand' && drawing){
      freehandPoints.push({x: pos.x, y: pos.y});
      console.log('freehand move', freehandPoints.length);
      redraw();
      ctx.beginPath();
      ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
      for(let i=1;i<freehandPoints.length;i++){
        ctx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
      }
      ctx.strokeStyle="#1c1c1c"; ctx.lineWidth=2;
      ctx.stroke();
    }
  };
  canvas.onmouseup = function(e){
    let pos = xy(e);
    if(drawMode==='freehand' && drawing){
      freehandPoints.push({x: pos.x, y: pos.y});
      console.log('freehand end', freehandPoints.length);
      drawObjects.push({type:'freehand', points: freehandPoints.slice()});
      redoStack = [];
      currentX = pos.x;
      currentY = pos.y;
      drawing = false;
      freehandPoints = [];
      redraw();
    }
  };
  canvas.onmouseleave = function(){
    if(drawing){
      if(drawMode === 'freehand' && freehandPoints.length > 1){
        drawObjects.push({type:'freehand', points: freehandPoints.slice()});
        redoStack = [];
        currentX = freehandPoints[freehandPoints.length-1].x;
        currentY = freehandPoints[freehandPoints.length-1].y;
        console.log('freehand cancel', freehandPoints.length);
      }
      drawing = false;
      freehandPoints = [];
      redraw();
    }
  };
  canvas.ontouchstart = function(e){
    let pos = xy(e);
    if(drawMode==='freehand'){
      drawing = true;
      freehandPoints = [{x: pos.x, y: pos.y}];
      console.log('freehand start', freehandPoints[0]);
    }
    e.preventDefault();
  };
  canvas.ontouchmove = function(e){
    let pos = xy(e);
    if(drawMode==='freehand' && drawing){
      freehandPoints.push({x: pos.x, y: pos.y});
      console.log('freehand move', freehandPoints.length);
      redraw();
      ctx.beginPath();
      ctx.moveTo(freehandPoints[0].x, freehandPoints[0].y);
      for(let i=1;i<freehandPoints.length;i++){
        ctx.lineTo(freehandPoints[i].x, freehandPoints[i].y);
      }
      ctx.strokeStyle="#1c1c1c"; ctx.lineWidth=2;
      ctx.stroke();
    }
    e.preventDefault();
  };
  canvas.ontouchend = function(e){
    let pos = xy(e);
    if(drawMode==='freehand' && drawing){
      freehandPoints.push({x: pos.x, y: pos.y});
      console.log('freehand end', freehandPoints.length);
      drawObjects.push({type:'freehand', points: freehandPoints.slice()});
      redoStack = [];
      currentX = pos.x;
      currentY = pos.y;
      drawing = false;
      freehandPoints = [];
      redraw();
    }else if(drawMode === 'text' || drawMode === 'number'){
      let txt = prompt('入力してください（最大8文字）');
      if(txt){
        txt = txt.substring(0,8);
        drawObjects.push({ type: 'text', x: pos.x, y: pos.y, text: txt });
        redoStack = [];
        redraw();
      }
    }else if(drawMode === 'line'){
      let snapped = false;
      const obj = findObjectAt(pos.x, pos.y);
      if(obj && obj.type === 'line'){
        const handles = [
          {x: obj.x1, y: obj.y1},
          {x: obj.x2, y: obj.y2},
          {x: (obj.x1 + obj.x2)/2, y: (obj.y1 + obj.y2)/2}
        ];
        let nearest = null;
        let minDist = Infinity;
        for(const h of handles){
          const d = Math.hypot(pos.x - h.x, pos.y - h.y);
          if(d < minDist){
            minDist = d;
            nearest = h;
          }
        }
        if(minDist <= 8){
          currentX = nearest.x;
          currentY = nearest.y;
          snapped = true;
        }
      }
      if(!snapped){
        currentX = pos.x;
        currentY = pos.y;
      }
      redraw();
    }
    e.preventDefault();
  };
  if(!isTouchDevice){
    canvas.onclick = function(e){
      if(drawing) return;
      let pos = xy(e);
      if(drawMode==='line'){
        let snapped = false;
        const obj = findObjectAt(pos.x, pos.y);
        if(obj && obj.type === 'line'){
          const handles = [
            {x: obj.x1, y: obj.y1},
            {x: obj.x2, y: obj.y2},
            {x: (obj.x1 + obj.x2)/2, y: (obj.y1 + obj.y2)/2}
          ];
          let nearest = null;
          let minDist = Infinity;
          for(const h of handles){
            const d = Math.hypot(pos.x - h.x, pos.y - h.y);
            if(d < minDist){
              minDist = d;
              nearest = h;
            }
          }
          if(minDist <= 8){
            currentX = nearest.x;
            currentY = nearest.y;
            snapped = true;
          }
        }
        if(!snapped){
          currentX = pos.x;
          currentY = pos.y;
        }
        redraw();
      } else if(drawMode==='text' || drawMode==='number'){        let txt = prompt("入力してください（最大8文字）");
        if(!txt) return;
        txt = txt.substring(0,8);
        drawObjects.push({type:'text', x:pos.x, y:pos.y, text:txt});
        redoStack = [];
        redraw();
      }
    };
  } else {
    canvas.onclick = null;
  }
}
// 図形タブを開いた時だけキャンバス初期化＆記録表示
const _oldSwitchTab = switchTab;
switchTab = function(tabId){
  _oldSwitchTab(tabId);
  if(tabId==="drawing"){
    setDrawMode("line");
    drawObjects = [];
    currentX = null;
    currentY = null;
    setupDrawingCanvas();
    redraw();
    showDrawingLog();
  }
};
let curveResultObj = null; // グローバル変数

function dmsToDecimal(dms) {
  const deg = Math.floor(dms / 10000);
  const min = Math.floor((dms % 10000) / 100);
  const sec = dms % 100;
  return deg + min / 60 + sec / 3600;
}
function decimalToDMS(deg) {
  const d = Math.floor(deg);
  const mFloat = (deg - d) * 60;
  const m = Math.floor(mFloat);
  let s = Math.round((mFloat - m) * 60);
  let mm = m, dd = d;
  if (s === 60) { s = 0; mm += 1; }
  if (mm === 60) { mm = 0; dd += 1; }
  return `${dd}°${mm}′${s}″`;
}

function calculateCurve() {
  const ipNo = document.getElementById("ipno").value;
  const iaInput = document.getElementById("ia").value;
  const r = parseFloat(document.getElementById("r").value);
  if (!iaInput || !r || isNaN(r)) {
    document.getElementById("curveResult").innerHTML = "入力値を確認してください";
    return;
  }
  // GAS式と同じ
  const iaDecimal = dmsToDecimal(parseInt(iaInput, 10));
  const iaRadHalf = (iaDecimal * Math.PI / 180) / 2;

  const mcDMS = decimalToDMS((180 - iaDecimal) / 2);                       // MC（角度で返す）

    const buildCurveRow = (radius, label) => {
    if (!radius || radius <= 0 || isNaN(radius)) {
      return {
        label,
        r: radius,
        tl: "—",
        sl: "—",
        cl: "—",
        cl2: "—",
        mc: mcDMS
      };
    }
    const tl = radius * Math.tan(iaRadHalf);                                      // 接線長 TL
    const sl = radius * (1 / Math.cos(iaRadHalf) - 1);                            // SL（GAS式。弦長ではない）
    const cl = radius * (iaDecimal * Math.PI / 180);                              // 曲線長 CL
    const clHalf = cl / 2;
    return {
      label,
      r: radius,
      tl: tl.toFixed(3),
      sl: sl.toFixed(3),
      cl: cl.toFixed(3),
      cl2: clHalf.toFixed(3),
      mc: mcDMS
    };
  };

  const baseRow = buildCurveRow(r, "R");
  const minusRow = buildCurveRow(r - 5, "R-5");
  const plusRow = buildCurveRow(r + 5, "R+5");

  const iaStr = decimalToDMS(iaDecimal);

  curveResultObj = {
    ipNo: ipNo ? ipNo : "",
    iaStr,
    r: baseRow.r,
    tl: baseRow.tl,
    sl: baseRow.sl,
    cl: baseRow.cl,
    cl2: baseRow.cl2,
    mc: baseRow.mc

  // 結果表示
  document.getElementById("curveResult").innerHTML = `
    <table class="survey-table">
      <tr><th>IP No</th><td>${curveResultObj.ipNo}</td></tr>
      <tr><th>IA</th><td>${curveResultObj.iaStr}</td></tr>
    </table>
    <table class="survey-table">
      <tr><th>R</th><th>TL</th><th>SL</th><th>CL</th><th>CL/2</th><th>MC</th></tr>
      <tr>
        <td>${minusRow.label} (${minusRow.r})</td>
        <td>${minusRow.tl}</td>
        <td>${minusRow.sl}</td>
        <td>${minusRow.cl}</td>
        <td>${minusRow.cl2}</td>
        <td>${minusRow.mc}</td>
      </tr>
      <tr>
        <td>${baseRow.label} (${baseRow.r})</td>
        <td>${baseRow.tl}</td>
        <td>${baseRow.sl}</td>
        <td>${baseRow.cl}</td>
        <td>${baseRow.cl2}</td>
        <td>${baseRow.mc}</td>
      </tr>
      <tr>
        <td>${plusRow.label} (${plusRow.r})</td>
        <td>${plusRow.tl}</td>
        <td>${plusRow.sl}</td>
        <td>${plusRow.cl}</td>
        <td>${plusRow.cl2}</td>
        <td>${plusRow.mc}</td>
      </tr>
    </table>`;
}
function registerCurve() {
  if (!curveResultObj) { alert("まず「計算する」を押してください"); return; }
  if (!activeProject) { alert("工事を選択してください"); return; }
  let allLogs = safeParseJSON(localStorage.getItem("curveLogs3"), {});
  const k = keyOfActive();
  if (!allLogs[k]) allLogs[k] = [];
  allLogs[k].push({...curveResultObj, time: new Date().toLocaleString()});
  localStorage.setItem("curveLogs3", JSON.stringify(allLogs));
  curveResultObj = null;
  document.getElementById('curveResult').innerHTML = "登録しました。";
  document.getElementById('ipno').value = "";
  document.getElementById('ia').value = "";
  document.getElementById('r').value = "";
  updateLogTab();
}

// --- 電卓機能 --- //
function appendCalc(v){
  document.getElementById('calcDisplay').value += v;
}
function clearCalc(){
  document.getElementById('calcDisplay').value = '';
}
function backspaceCalc(){
  const display = document.getElementById('calcDisplay');
  display.value = display.value.slice(0, -1);
}
function evaluateCalc(){
  const display = document.getElementById('calcDisplay');
  const msg = document.getElementById('calcMsg');
  const expr = display.value;
  msg.textContent = '';  try{
    const parser = new CalcParser(expr);
    const result = parser.parse();
    display.value = result;
    return result;
  }catch(e){
    display.value = 'Error';
    msg.textContent = '無効な式です';
    return null;
  }
}

function copyCalc(){
  const text = document.getElementById('calcDisplay').value;
  const msg = document.getElementById('calcMsg');
  if(!text){ msg.textContent = 'コピー対象がありません'; return; }
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).catch(() => {
      msg.textContent = 'コピーできませんでした';
    });
  } else {
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try{
      document.execCommand('copy');
    }catch(e){
      msg.textContent = 'コピーできませんでした';
    }
    document.body.removeChild(input);
  }
}

class CalcParser{
  constructor(str){
    this.str = str;
    this.pos = 0;
  }
  peek(){
    return this.str[this.pos];
  }
  skip(){
    while(this.pos < this.str.length && /\s/.test(this.str[this.pos])) this.pos++; 
  }
  parse(){
    const val = this.parseExpression();
    this.skip();
    if(this.pos !== this.str.length) throw new Error('invalid');
    return val;
  }
  parseExpression(){
    let val = this.parseTerm();
    while(true){
      this.skip();
      const ch = this.peek();
      if(ch === '+' || ch === '-'){
        this.pos++;
        const right = this.parseTerm();
        val = ch === '+' ? val + right : val - right;
      }else break;
    }
    return val;
  }
  parseTerm(){
    let val = this.parseFactor();
    while(true){
      this.skip();
      const ch = this.peek();
      if(ch === '*' || ch === '/' || ch === '%'){
        this.pos++;
        const right = this.parseFactor();
        if(ch === '*') val = val * right;
        else if(ch === '/') val = val / right;
        else val = val % right;      }else break;
    }
    return val;
  }
  parseFactor(){
    this.skip();
    let ch = this.peek();
    if(ch === '+' || ch === '-'){
      this.pos++;
      const val = this.parseFactor();
      return ch === '-' ? -val : val;
    }
    if(ch === '('){
      this.pos++;
      const val = this.parseExpression();
      this.skip();
      if(this.peek() !== ')') throw new Error('missing )');
      this.pos++;
      return val;
    }
    return this.parseNumber();
  }
  parseNumber(){
    this.skip();
    let start = this.pos;
    if(this.peek() === '.') this.pos++; 
    while(/\d/.test(this.peek())) this.pos++;
    if(this.peek() === '.'){ this.pos++; while(/\d/.test(this.peek())) this.pos++; }
    const substr = this.str.slice(start, this.pos);
    if(!substr || /^\.?$/.test(substr)) throw new Error('number');
    return parseFloat(substr);
  }
}

// --- Calculator modal management ---
let calcParent = null;
function openCalcModal(){
  const calc = document.getElementById('calc');
  const overlay = document.getElementById('calcOverlay');
  if(!calcParent) calcParent = calc.parentElement;
  overlay.style.display = 'flex';
  overlay.appendChild(calc);
  calc.classList.add('modal-mode');
  calc.onclick = e => e.stopPropagation();
}
function closeCalcModal(){
  const calc = document.getElementById('calc');
  const overlay = document.getElementById('calcOverlay');
  overlay.style.display = 'none';
  calc.classList.remove('modal-mode');
  calc.onclick = null;
  if(calcParent) calcParent.appendChild(calc);
}
