// import zip from "jszip";
/**
 * The function `downloadFlowJSONFromGH` downloads a flow JSON file from a
 * GitHub URL, decodes it from base64, and triggers a file download.
 */
const downloadFlowJSONFromGH = async () => {
  // Debug controlled via flow instance var `debug`
  const debug = "{{global.variables.debug}}";
  // const debug = debugflowInstVar ? debugflowInstVar : false;

  const JSZip = require("jszip");
  const zip = new JSZip();

  const blob = new Blob();
  const flows = await dlFlows();

  if (debug) {
    console.log("flows:", flows.toString());
  }

  if (!flows) {
    console.error("No go. No flows.");
  }

  const flowNames = Object.keys(flows);
  for (const name of flowNames) {
    if (debug) {
      console.log("flow name:", name);
    }
    archive.append(flows[name], { name: name + ".json" });
    zip.generateAsync({ type: "blob" }).then(function (flows[name]) {
      saveAs(flows[name], name + ".zip");
    });
  }

  const arch = await archive.finalize();

  if (debug) {
    console.log("arch:", arch);
  }

  try {
    if (flowJSON) {
      triggerFileDownload({ ghFlowJSONResBody: flowJSON, debug });
    } else {
      throw new Error("Could not download");
    }
  } catch (error) {
    console.error(error);
  }
};

const dlFlows = async () => {
  const pwlessRegAuthnURL = "{{global.variables.pwless-reg-authn-url}}";
  const deviceMgmtURL = "{{global.variables.device-mgmt-url}}";
  const pwResetURL = "{{global.variables.pw-reset-url}}";
  const profileMgmtURL = "{{global.variables.profile-mgmt-url}}";

  // const urls = [];
  // urls.push(pwlessRegAuthnURL);
  // urls.push(deviceMgmtURL);
  // urls.push(pwResetURL);
  // urls.push(profileMgmtURL);

  const urls = {
    "OOTB - Passwordless - Registration, Authentication, & Account Recovery - Main Flow":
      pwlessRegAuthnURL,
    "OOTB_Device Management - Main Flow": deviceMgmtURL,
    "OOTB_Password Reset - Main Flow": pwResetURL,
    "OOTB_Basic Profile Management.json": profileMgmtURL,
  };

  const flowJSONs = {};

  await Promise.all(
    Object.keys(urls).map(async (name, i, arr) => {
      const res = await fetch(urls[name]);
      const flowJSON = await res.json();
      flowJSONs[name] = flowJSON;
    })
  );

  return flowJSONs;
};

/**
 * The function `calcGHURL` determines the appropriate GitHub URL
 * based on the value of the `flowShortName` variable.
 * @returns The function `calcGHURL` returns the URL that
 * corresponds to the value of the `flowShortName` variable. If the
 * `flowShortName` matches one of the expected values ("pwless-reg-authn",
 * "device-mgmt", "pw-reset", "profile-mgmt"), then the corresponding URL is returned. If the
 * `flowShortName` does not match any of the expected values,
 */
const calcGHURL = () => {
  const pwlessRegAuthnURL = "{{global.variables.pwless-reg-authn-url}}";
  const deviceMgmtURL = "{{global.variables.device-mgmt-url}}";
  const pwResetURL = "{{global.variables.pw-reset-url}}";
  const profileMgmtURL = "{{global.variables.profile-mgmt-url}}";

  const flowShortName = "{{global.variables.flow-short-name}}";

  // Default to Passwordless Registration and Authentication url if can't match
  // flow-short-name to an expected value
  let flowGHUrl = pwlessRegAuthnURL;
  switch (flowShortName) {
    case "pwless-reg-authn":
      flowGHUrl = pwlessRegAuthnURL;
      break;
    case "device-mgmt":
      flowGHUrl = deviceMgmtURL;
      break;
    case "pw-reset":
      flowGHUrl = pwResetURL;
      break;
    case "profile-mgmt":
      flowGHUrl = profileMgmtURL;
      break;
    default:
      console.error("Unexpected flow-short-name. Using default url.");
      break;
  }

  return flowGHUrl;
};

/**
 * The function `decodeParseFormatJSON` decodes a Base64 encoded JSON string,
 * parses it as JSON, and then converts it back to a formatted JSON string.
 * @param flowJSONB64 - The `flowJSONB64` parameter is a string that represents
 * a JSON object encoded in Base64 format.
 * @returns The function `decodeParseFormatJSON` returns a string representation
 * of the parsed JSON object with formatting.
 */
const decodeParseFormatJSON = async ({ flowJSONB64, debug }) => {
  try {
    // Base64 decode
    const decodedFlowJSON = atob(flowJSONB64);
    if (debug === "true") {
      console.log("decodedFlowJSON:", decodedFlowJSON);
    }

    // Try to parse as JSON
    const flowJSON = JSON.parse(decodedFlowJSON);
    if (debug === "true") {
      console.log("flowJSON:", flowJSON);
    }

    // Convert from object to string with formatting
    const flowJSONStr = JSON.stringify(flowJSON, null, 2);
    if (debug === "true") {
      console.log("flowJSONStr:", flowJSONStr);
    }

    return flowJSONStr;
  } catch (error) {
    throw new Error("Failed to read as JSON", { cause: error });
  }
};

/*
 * The `triggerFileDownload` function is responsible for creating a downloadable
 * link for the flow JSON file and triggering the download.
 */
triggerFileDownload = ({ flowJSONStr, debug }) => {
  // Create a link element
  const link = document.createElement("a");
  // Create a url using the flow json in plain text
  const blob = new Blob([flowJSONStr], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  // Filename
  link.download =
    "anthony---" + "{{global.variables.flow-short-name}}" + ".json";
  // URL that contains the flow json text
  link.href = url;

  if (debug === "true") {
    console.log(link);
  }

  // Trigger download
  link.click();
};

/**
 * The function `runIfPageCompletedLoading` checks if the document has finished
 * loading and if so, it calls the `downloadFlowJSONFromGH` function.
 * @param event - The `event` parameter is an object that represents the event
 * that triggered the function.
 */
const runIfPageCompletedLoading = (event) => {
  console.log("event:", event);
  if (document.readyState === "complete") {
    downloadFlowJSONFromGH();
  }
};

const waitForPageLoadingCompletion = () => {
  /**
   * Wait for page to load to start or wait and listen for page loaded signal
   */
  if (document.readyState !== "complete") {
    // Loading hasn't finished yet, add a listener to start the function when the
    // page has loaded
    document.addEventListener("readystatechange", runIfPageCompletedLoading);
  } else {
    // Page had completed loading, trigger the main function
    const dlBtn = document.getElementById("dlBtn");
    if (dlBtn) {
      dlBtn.addEventListener("click", async () => {
        await downloadFlowJSONFromGH();
      });
    }
  }
};

// Start the script
waitForPageLoadingCompletion();
