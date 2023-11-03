import { CaptureController } from "./capture.js";
import { RecordController } from "./record.js";
import { UploadController } from "./upload.js";
import { html, render } from "https://unpkg.com/lit-html";
import { until } from "https://unpkg.com/lit-html/directives/until.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const serverUrl = window.location.hostname.startsWith("localhost")
  ? "https://localhost:8080"
  : "https://reckless-vmug6tr6ga-ew.a.run.app";

const firebaseConfig = {
  apiKey: "AIzaSyD_-CtDTFjODnrKYTxsz-ThY9vbh5X9-bo",
  authDomain: "reckless-fb.firebaseapp.com",
  projectId: "reckless-fb",
  storageBucket: "reckless-fb.appspot.com",
  messagingSenderId: "293856414134",
  appId: "1:293856414134:web:98932c7bd8819df0f91917",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const provider = new GoogleAuthProvider();
const auth = getAuth();
const storage = getStorage();
const updates = new EventTarget();

const warningBlock = (message) => html`<div class="warning">
  ${warningIcon} <span>${message}</span>
</div>`;

const loginButton = () => html`
  <span
    class="material-symbols-outlined"
    @click=${() => signInWithPopup(auth, provider)}
  >
    login
  </span>
`;
const logoutButton = () => html`
  <span class="material-symbols-outlined" @click=${() => signOut(auth)}>
    logout
  </span>
`;
const loginView = () => html` <div class="login-view">${loginButton()}</div> `;
const materialIcon = (name) =>
  html`<span class="material-symbols-outlined">${name}</span>`;
const errorIcon = materialIcon("error");
const warningIcon = materialIcon("warning");
const miniRecorderIcons = {
  capture: {
    display: {
      error: materialIcon("mimo_disconnect"),
      active: materialIcon("mimo"),
      inactive: materialIcon("mimo_disconnect"),
    },
    user: {
      error: materialIcon("hangout_video_off"),
      active: materialIcon("hangout_video"),
      inactive: materialIcon("hangout_video_off"),
    },
  },
  record: {
    error: materialIcon("radio_button_unchecked"),
    active: materialIcon("radio_button_partial"),
  },
  upload: {
    request: materialIcon("radio_button_checked"),
  },
};

const miniRecorderStatus = ({ ctrl, state, warning, icon }) => {
  return html`
    <div class="mini-recorder-status">
      ${icon} ${warning ? warningBlock(warning) : ""}
    </div>
  `;
};

const miniRecorder = ({ media }) => {
  const cap = new CaptureController(media);
  const rec = new RecordController();
  const upl = new UploadController(serverUrl);

  const mediaIcons = miniRecorderIcons.capture[media];
  const $status = document.createElement("span");
  const $icon = document.createElement("span");

  const update = (event) => {
    console.debug("[miniRecorder.update]", event);

    let ctrl = event.target.constructor.name
      .toLowerCase()
      .replace("controller", "");
    let state = event.type;
    let warning = event.type === "error" && event.detail?.message;
    let icon = miniRecorderIcons[ctrl]?.[state];

    render(mediaIcons[state] || mediaIcons.inactive, $icon);
    render(miniRecorderStatus({ ctrl, state, warning, icon }), $status);

    updates.dispatchEvent(new CustomEvent("update", { detail: { event } }));
  };

  upl.addEventListener("request", update);
  upl.addEventListener("response", update);

  upl.addEventListener("error", update);

  rec.addEventListener("active", (e) => {
    update(e);
    upl.ready().then((ok) => ok && upl.start(media, rec.stream));
  });
  rec.addEventListener("inactive", (e) => {
    update(e);
    upl.retry = false;
  });
  rec.addEventListener("error", (e) => {
    update(e);
    rec.start(cap.stream);
  });
  cap.addEventListener("active", (e) => {
    update(e);
    upl.retry = true;
    rec.start(cap.stream);
  });
  cap.addEventListener("inactive", update);
  cap.addEventListener("error", update);

  return html`
    <div class="mini-recorder">
      <button
        class="icon-button"
        @click=${() => {
          if (cap.stream) {
            cap.stop();
          } else {
            cap.start();
          }
        }}
      >
        ${$icon}
      </button>
      ${$status}
    </div>
  `;
};

const fetchAndRenderRecordings = (listRef, $list) =>
  listAll(listRef)
    .then((res) => {
      render(recordingsList(res), $list);
      return $list;
    })
    .catch((error) => {
      render(warningBlock(error.message), $list);
      return $list;
    });

const recordingsList = (res) => {
  const prefixes = res.prefixes.map((f) => {
    const listRef = ref(storage, f);
    const $list = fetchAndRenderRecordings(
      listRef,
      document.createElement("div")
    );

    return html`<li class="recording-list-item">
      <span>${f.name}</span>
      ${until($list, html`<span>Loading...</span>`)}
    </li>`;
  });

  const items = Promise.all(
    res.items.map(async (i) => {
      const iRef = ref(storage, i.fullPath);
      try {
        const href = await getDownloadURL(iRef);
        return html` <li class="recording-list-item">
          <div>
            <a href="${href}" target="_blank">${i.name}</a>
            <button
              class="icon-button"
              @click=${(e) =>
                deleteObject(iRef)
                  .then(() => e.target.closest(".recording-list-item").remove())
                  .catch(console.error)}
            >
              ${materialIcon("delete")}
            </button>
          </div>
        </li>`;
      } catch (error) {
        return html`
          <li><div>${i.name} ${warningBlock(error.message)}</div></li>
        `;
      }
    })
  );

  return html`
    <ul class="recording-list">
      ${prefixes} ${until(items, html`<span>...</span>`)}
    </ul>
  `;
};

const recordingsView = () => {
  const listRef = ref(storage, auth.currentUser.uid);
  const $list = document.createElement("div");
  const recordings = fetchAndRenderRecordings(listRef, $list);

  updates.addEventListener("update", ({ detail: { event } }) => {
    if (event.type === "response") {
      fetchAndRenderRecordings(listRef, $list);
    }
  });

  return html`
    <section>
      <h2>Recordings</h2>
      ${until(recordings, html`<span>Loading...</span>`)}
    </section>
  `;
};

const userView = () => {
  return html`
    <div class="user-view">
      <header class="topnav">
        <div>
          <span class="material-symbols-outlined">
            keyboard_double_arrow_up
          </span>
          <span>reckless</span>
        </div>
        <div>${logoutButton()}</div>
      </header>
      <aside class="sidenav">
        ${miniRecorder({ media: "display" })} ${miniRecorder({ media: "user" })}
      </aside>
      <article class="content">${recordingsView()}</article>
    </div>
  `;
};

const appView = ({ user }) => html`
  <div class="app-view">${user ? userView() : loginView()}</div>
`;

// $ prefix reserved for dom elements
const $app = document.createElement("div");
document.body.append($app);

onAuthStateChanged(auth, (user) => {
  render(appView({ user }), $app);
});
