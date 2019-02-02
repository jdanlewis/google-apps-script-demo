// responseIDs map responses to a unique ID for use in the template.
// This array of response IDs should match the order of the form's questions.
var responseIDs = [
  "name",
  "email",
  "food"
];

// folderName is the name of the folder in which response documents are saved.
var folderName = "Example Form Responses";

// fileName is the name of the file used when saving the document.
var fileName = "Example Response " +  new Date().toISOString();

// emailSubject is the subject line to be used in the email reply to the form submission.
var emailSubject = "Example Response";
  
// onFormSubmit is triggered when the form is submitted.
function onFormSubmit(e) {

  if (!e || !e.response) {
    Logger.log("No response provided. Aborting!");
    return;
  }
  
  var responses = getResponses(e.response);
  if (!responses) {
    Logger.log("Unable to get responses. Aborting!");
    return;
  }
  
  var blob = parseTemplate(responses);
  var folder = getFolder();
  var file = saveFile(blob, folder);
  
  var email = responses["email"];
  if (!email) {
    Logger.log("No email provided. Aborting!");
    return;
  }
  shareFile(file, email);
}

// getResponses accepts a FormResponse and returns a dictionary of
// responses where keys are response IDs and their values are responses.
function getResponses(formResponse) {
  var itemResponses = formResponse.getItemResponses();
  var responses = {};
  if (itemResponses.length !== responseIDs.length) {
    Logger.log("WARNING: responseIDs does not match the length of the form response.");
    return;
  }
  for (var i = 0; i < itemResponses.length; i++) {
    var responseID = responseIDs[i];
    var response = itemResponses[i].getResponse();
    responses[responseID] = response;
  }
  return responses;
}

// parseTemplate accepts a dictionary of responses and evaluates an HTML
// template, returning the result as a Blob.
function parseTemplate(responses) {
  var template = HtmlService.createTemplateFromFile("template");
  template.data = responses;
  var html = template.evaluate();
  return html.getBlob();
}

// saveFile saves a Blob as a doc to a Folder, returning the File.
// Advanced Google services must be enabled:
// https://developers.google.com/apps-script/guides/services/advanced
function saveFile(blob, folder) {
  var f = Drive.Files.insert({title: fileName}, blob, {convert: true});
  var file = DriveApp.getFileById(f.id);
  moveToFolder(file, folder);
  return file;
}

// getFolder gets the folder for response documents, creating the folder if
// it does not exist.
function getFolder() {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(folderName);
}

// moveToFolder moves a File to a Folder.
function moveToFolder(file, folder) {
  var parents = file.getParents();
  while (parents.hasNext()) {
    parents.next().removeFile(file);
  }
  folder.addFile(file);
}

// shareFile shares a File with an email address.
function shareFile(file, email) {
  file.addEditors([email]);
  var body = "Thank you for completing the example form. Your document is available at: " + file.getUrl();
  MailApp.sendEmail({
    to: email,
    subject: emailSubject,
    body: body
  })
}