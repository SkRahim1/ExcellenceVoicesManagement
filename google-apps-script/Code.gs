/**
 * Excellence Voices Management (EVM)
 * Google Apps Script (GAS) Database Proxy & Utility Service
 *
 * Deploy this script as a Web App:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Replace all code with this file contents.
 * 4. Replace placeholder Folder IDs (BACKUP_FOLDER_ID and EXPORT_FOLDER_ID) with your Google Drive Folder IDs.
 * 5. Click Deploy > New deployment.
 * 6. Choose "Web app" type. Execute as "Me", Access: "Anyone".
 * 7. Copy the Web App URL and paste it into the EVM settings screen.
 */

const BACKUP_FOLDER_ID = "YOUR_GOOGLE_DRIVE_BACKUPS_FOLDER_ID";
const EXPORT_FOLDER_ID = "YOUR_GOOGLE_DRIVE_EXPORTS_FOLDER_ID";

// Core sheet tables
const SHEET_NAMES = [
  "schools",
  "payments",
  "trainers",
  "trainerPayments",
  "expenses",
  "contributions",
  "logs"
];

// Helper to set CORS and JSON headers
function handleResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * HTTP GET Request Handler
 * Used to fetch all database records at once.
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action === "readAll") {
      const dbData = {};
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      
      SHEET_NAMES.forEach(sheetName => {
        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
          // Auto-initialize sheet if it does not exist
          sheet = ss.insertSheet(sheetName);
          // Set seed/initial header labels if it's new
          initializeHeaders(sheet, sheetName);
        }
        dbData[sheetName] = readSheetData(sheet);
      });
      
      return handleResponse({ success: true, data: dbData });
    }
    
    return handleResponse({ success: false, error: "Invalid action or parameters" });
  } catch (error) {
    return handleResponse({ success: false, error: error.toString() });
  }
}

/**
 * HTTP POST Request Handler
 * Handles adding, updating, and maintenance actions.
 */
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const sheetName = postData.sheet;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    if (action === "addRow") {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error("Sheet not found: " + sheetName);
      
      const newRecord = addRowToSheet(sheet, postData.data);
      return handleResponse({ success: true, data: newRecord });
    }
    
    if (action === "updateRow") {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) throw new Error("Sheet not found: " + sheetName);
      
      const idKey = postData.idKey; // e.g. "school_id"
      const idValue = postData.idValue;
      const updatedRecord = updateRowInSheet(sheet, idKey, idValue, postData.data);
      return handleResponse({ success: true, data: updatedRecord });
    }
    
    if (action === "archiveRow") {
      const sourceSheet = ss.getSheetByName(sheetName);
      let archiveSheet = ss.getSheetByName("Archive_" + sheetName);
      
      if (!sourceSheet) throw new Error("Source sheet not found: " + sheetName);
      if (!archiveSheet) {
        archiveSheet = ss.insertSheet("Archive_" + sheetName);
        initializeHeaders(archiveSheet, "Archive_" + sheetName);
      }
      
      const idKey = postData.idKey;
      const idValue = postData.idValue;
      const result = archiveRowInSheet(sourceSheet, archiveSheet, idKey, idValue, postData.userId);
      return handleResponse(result);
    }
    
    if (action === "manualBackup") {
      runDailyBackup();
      return handleResponse({ success: true, message: "Backup successfully triggered." });
    }
    
    if (action === "manualExport") {
      const downloadUrl = runWeeklyExcelExport();
      return handleResponse({ success: true, downloadUrl: downloadUrl, message: "Export successfully triggered." });
    }
    
    return handleResponse({ success: false, error: "Invalid action type" });
  } catch (error) {
    return handleResponse({ success: false, error: error.toString() });
  }
}

/**
 * Parse headers and rows into JSON objects dynamically.
 */
function readSheetData(sheet) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  const list = [];
  
  for (let r = 1; r < values.length; r++) {
    const row = values[r];
    // Skip empty lines
    if (row.join("").trim() === "") continue;
    
    const obj = {};
    for (let c = 0; c < headers.length; c++) {
      const val = row[c];
      // Format dates into YYYY-MM-DD strings for consistency with frontend React controls
      if (val instanceof Date) {
        // Check if it's only a date or date-time
        if (headers[c].indexOf("date") !== -1 && headers[c].indexOf("created") === -1 && headers[c].indexOf("updated") === -1) {
          obj[headers[c]] = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          obj[headers[c]] = val.toISOString();
        }
      } else {
        obj[headers[c]] = val;
      }
    }
    list.push(obj);
  }
  
  return list;
}

/**
 * Match posted object keys to sheet columns and append.
 */
function addRowToSheet(sheet, dataObj) {
  const headers = sheet.getDataRange().getValues()[0];
  const rowValues = new Array(headers.length).fill("");
  
  for (let c = 0; c < headers.length; c++) {
    const key = headers[c];
    if (dataObj[key] !== undefined) {
      rowValues[c] = dataObj[key];
    }
  }
  
  sheet.appendRow(rowValues);
  return dataObj;
}

/**
 * Find row by ID, update cell values matching keys in updateObj.
 */
function updateRowInSheet(sheet, idKey, idValue, updateObj) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  const headers = values[0];
  
  const idColIndex = headers.indexOf(idKey);
  if (idColIndex === -1) throw new Error("Primary ID key column not found: " + idKey);
  
  let targetRowIndex = -1;
  for (let r = 1; r < values.length; r++) {
    if (String(values[r][idColIndex]) === String(idValue)) {
      targetRowIndex = r + 1; // 1-indexed row number
      break;
    }
  }
  
  if (targetRowIndex === -1) throw new Error("Record with ID " + idValue + " not found.");
  
  // Apply updates column by column
  for (let c = 0; c < headers.length; c++) {
    const key = headers[c];
    if (updateObj[key] !== undefined && key !== idKey) {
      sheet.getCell(targetRowIndex, c + 1).setValue(updateObj[key]);
    }
  }
  
  // Update timestamp if present
  const updatedColIndex = headers.indexOf("updated_date");
  if (updatedColIndex !== -1) {
    sheet.getCell(targetRowIndex, updatedColIndex + 1).setValue(new Date().toISOString());
  }
  
  // Return the updated row
  const rowValues = sheet.getRange(targetRowIndex, 1, 1, headers.length).getValues()[0];
  const obj = {};
  for (let c = 0; c < headers.length; c++) {
    obj[headers[c]] = rowValues[c];
  }
  return obj;
}

/**
 * Move row from source sheet to archive sheet, adding metadata.
 */
function archiveRowInSheet(sourceSheet, archiveSheet, idKey, idValue, userId) {
  const sRange = sourceSheet.getDataRange();
  const sValues = sRange.getValues();
  const sHeaders = sValues[0];
  
  const idColIndex = sHeaders.indexOf(idKey);
  if (idColIndex === -1) return { success: false, error: "Primary ID key column not found: " + idKey };
  
  let targetRowIndex = -1;
  for (let r = 1; r < sValues.length; r++) {
    if (String(sValues[r][idColIndex]) === String(idValue)) {
      targetRowIndex = r + 1;
      break;
    }
  }
  
  if (targetRowIndex === -1) return { success: false, error: "Record not found" };
  
  const rowValues = sourceSheet.getRange(targetRowIndex, 1, 1, sHeaders.length).getValues()[0];
  
  // Build archive row (match archive columns)
  const aHeaders = archiveSheet.getDataRange().getValues()[0];
  const archiveRowValues = new Array(aHeaders.length).fill("");
  
  for (let c = 0; c < aHeaders.length; c++) {
    const key = aHeaders[c];
    if (key === "archived_date") {
      archiveRowValues[c] = new Date();
    } else if (key === "archived_by") {
      archiveRowValues[c] = userId || "System";
    } else {
      const sourceColIdx = sHeaders.indexOf(key);
      if (sourceColIdx !== -1) {
        archiveRowValues[c] = rowValues[sourceColIdx];
      }
    }
  }
  
  archiveSheet.appendRow(archiveRowValues);
  sourceSheet.deleteRow(targetRowIndex);
  
  return { success: true };
}

/**
 * System Setup Headers Setup
 */
function initializeHeaders(sheet, name) {
  const headers = {
    schools: ["school_id", "school_name", "principal_name", "coordinator_name", "mobile_number", "email", "address", "trainer_id", "contract_amount", "advance_for_books", "recommended_installment", "remarks", "status", "start_date", "created_date", "updated_date"],
    payments: ["payment_id", "school_id", "month", "amount", "payment_date", "remarks", "created_by", "created_at"],
    trainers: ["trainer_id", "trainer_name", "mobile", "email", "joining_date", "status"],
    trainerPayments: ["payout_id", "trainer_id", "month", "amount", "payment_date", "remarks", "created_by", "created_at"],
    expenses: ["expense_id", "category", "amount", "date", "remarks", "added_by", "created_at"],
    contributions: ["contribution_id", "partner_name", "amount", "date", "remarks", "added_by", "created_at"],
    logs: ["log_id", "date", "time", "user", "action", "description"]
  };
  
  const baseName = name.replace("Archive_", "");
  if (headers[baseName]) {
    let sheetHeaders = headers[baseName];
    if (name.indexOf("Archive_") === 0) {
      sheetHeaders = sheetHeaders.concat(["archived_date", "archived_by"]);
    }
    sheet.appendRow(sheetHeaders);
  }
}

/**
 * Scheduled Daily Backup Routine (Time-driven at 02:00 AM)
 */
function runDailyBackup() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let folder;
  
  try {
    folder = DriveApp.getFolderById(BACKUP_FOLDER_ID);
  } catch(e) {
    // Fallback: use Sheet's parent folder if folder ID is not configured/invalid
    const parents = DriveApp.getFileById(activeSpreadsheet.getId()).getParents();
    folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  }
  
  const dateString = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-dd");
  const backupName = "EVM_Backup_" + dateString;
  
  // Duplicate active sheets instance
  DriveApp.getFileById(activeSpreadsheet.getId()).makeCopy(backupName, folder);
  
  // Clean up snapshots older than 30 days
  const files = folder.getFiles();
  const backups = [];
  
  while (files.hasNext()) {
    const file = files.next();
    if (file.getName().indexOf("EVM_Backup_") === 0) {
      backups.push(file);
    }
  }
  
  if (backups.length > 30) {
    backups.sort((a, b) => a.getDateCreated() - b.getDateCreated());
    while (backups.length > 30) {
      const oldFile = backups.shift();
      oldFile.setTrashed(true);
    }
  }
}

/**
 * Scheduled Weekly Excel Export (Time-driven Sundays at 23:59 PM)
 */
function runWeeklyExcelExport() {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const spreadsheetId = activeSpreadsheet.getId();
  let folder;
  
  try {
    folder = DriveApp.getFolderById(EXPORT_FOLDER_ID);
  } catch(e) {
    const parents = DriveApp.getFileById(activeSpreadsheet.getId()).getParents();
    folder = parents.hasNext() ? parents.next() : DriveApp.getRootFolder();
  }
  
  const dateString = Utilities.formatDate(new Date(), "GMT+5:30", "yyyy-MM-ww");
  const fileName = "EVM_Weekly_Export_" + dateString + ".xlsx";
  
  const url = "https://docs.google.com/spreadsheets/d/" + spreadsheetId + "/export?format=xlsx";
  const response = UrlFetchApp.fetch(url, {
    headers: {
      'Authorization': 'Bearer ' +  ScriptApp.getOAuthToken()
    },
    muteHttpExceptions: true
  });
  
  if (response.getResponseCode() === 200) {
    const blob = response.getBlob().setName(fileName);
    const file = folder.createFile(blob);
    return file.getUrl(); // Returns clickable URL
  }
  
  throw new Error("Weekly export failed. HTTP response code: " + response.getResponseCode());
}
