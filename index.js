const downloadFlowJSONFromGH = async () => {
  // Debug controlled via flow instance var `debug`
  const debugFlowInstVar = "{{global.variables.debug}}";
  const debug = debugFlowInstVar === "true" ? true : false;

  try {
    // package to zip up the files
    const JSZip = require("jszip");
    const zip = new JSZip();
    // package to trigger the file download
    const FileSaver = require("file-saver");
    const saveAs = FileSaver.saveAs;

    const flows = await dlFlows({ debug });

    if (debug) {
      console.log("flows:", flows.toString());
    }

    if (!flows) {
      console.error("No go. No flows.");
    }

    const flowNames = Object.keys(flows);

    if (debug) {
      console.log("flowNames:", flowNames);
    }

    for (const name of flowNames) {
      const filename = name + ".json";

      const strFlowJSON = parseThenStringifyJSON({
        name,
        flows,
        debug,
      });

      if (debug) {
        console.log("zip filename:", filename);
        console.log("zip contents length:", strFlowJSON.length);
        console.log("zip contents:", strFlowJSON);
      }

      // add flow json file to zip
      zip.file(filename, strFlowJSON);
    }

    if (debug) {
      // count the number of flows that are in the zip
      let numFlowsZipped = 0;
      zip.forEach(() => numFlowsZipped++);

      console.log("number of flows zipped:", numFlowsZipped);
    }

    const zipName = "passwordlessFlowPackForCustomers";
    // trigger download of zip file
    zip.generateAsync({ type: "blob" }).then(function (blob) {
      saveAs(blob, zipName + ".zip");
    });
  } catch (error) {
    console.error(error);
  }
};

const parseThenStringifyJSON = ({ name, flows, debug }) => {
  try {
    if (debug) {
      console.log("parsing flow:", name);
      console.log(flows[name]);
    }

    const strFlowJSON = JSON.stringify(flows[name], null, 2);

    if (debug) {
      console.log("flow name:", name);
      console.log("stringified flow JSON:", strFlowJSON);
    }

    return strFlowJSON;
  } catch (error) {
    throw new Error("Failed to stringify flow json", {
      cause: error,
    });
  }
};

const dlFlows = async ({ debug }) => {
  try {
    const pwlessRegAuthnURL = "{{global.variables.pwless-reg-authn-url}}";
    const deviceMgmtURL = "{{global.variables.device-mgmt-url}}";
    const pwResetURL = "{{global.variables.pw-reset-url}}";
    const profileMgmtURL = "{{global.variables.prof-mgmt-url}}";

    const urls = {
      "OOTB_Passwordless - Registration, Authentication, & Account Recovery - Main Flow":
        pwlessRegAuthnURL,
      "OOTB_Device Management - Main Flow": deviceMgmtURL,
      "OOTB_Password Reset - Main Flow": pwResetURL,
      "OOTB_Basic Profile Management.json": profileMgmtURL,
    };

    // Init object to Collect flow json contents
    const flowJSONs = {};

    const flows = await Promise.all(
      Object.keys(urls).map(async (name, i, arr) => {
        try {
          if (debug) {
            console.log("urls:", arr.toString());
            console.log("fetching flow:", name);
            console.log("fetching from url:", urls[name]);
          }

          // Fetch flow json from GH and get body as json
          const res = await fetch(urls[name]);
          const flowJSON = await res.json();

          if (debug) {
            console.log("response body:", flowJSON);
          }

          // Add this flow json
          flowJSONs[name] = flowJSON;

          return flowJSON;
        } catch (err) {
          throw new Error(
            "Failed to download flow: " + name + " --- from: " + urls[name],
            { cause: err }
          );
        }
      })
    );

    return flowJSONs;
  } catch (error) {
    throw new Error("Downloading flow json files from GH failed", {
      cause: error,
    });
  }
};

const addListenerToDLBtn = () => {
  const dlBtn = document.getElementById("dlBtn");
  if (dlBtn) {
    dlBtn.addEventListener("click", async () => {
      await downloadFlowJSONFromGH();
    });
  }
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
    addListenerToDLBtn();
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
    // Also, add listener to button so the download button still works if needed
    addListenerToDLBtn();
    downloadFlowJSONFromGH();
  }
};

// Start the script
waitForPageLoadingCompletion();
