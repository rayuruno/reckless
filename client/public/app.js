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
} from "https://www.gstatic.com/firebasejs/10.5.2/firebase-storage.js";

const serverUrl = "https://localhost:9000";

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
    console.log(event);
    let ctrl = event.target.constructor.name
      .toLowerCase()
      .replace("controller", "");
    let state = event.type;
    let warning = event.type === "error" && event.detail?.message;
    let icon = miniRecorderIcons[ctrl]?.[state];

    render(mediaIcons[state] || mediaIcons.inactive, $icon);
    render(miniRecorderStatus({ ctrl, state, warning, icon }), $status);
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
const recordingsList = (res) => {
  const prefixes = res.prefixes.map((f) => {
    const $list = document.createElement("div");
    // Create a reference under which you want to list
    const listRef = ref(storage, f);
    // Find all the prefixes and items.
    listAll(listRef)
      .then((res) => {
        render(recordingsList(res), $list);
      })
      .catch((error) => {
        render(warningBlock(error.message), $list);
      });

    return html`<li>
      <span>${f.name}</span>
      ${$list}
    </li>`;
  });

  const items = Promise.all(
    res.items.map(async (i) => {
      try {
        console.log(i);
        const href = await getDownloadURL(ref(storage, i.fullPath));
        console.log(href);
        return html` <li><a href="${href}">${i.name}</a></li> `;
      } catch (error) {
        return html` <li>${i.name} ${warningBlock(error.message)}</li> `;
      }
    })
  );

  return html`
    <ul>
      ${prefixes} ${until(items, html`<span>...</span>`)}
    </ul>
  `;
};

const recordingsView = () => {
  const $list = document.createElement("div");

  // Create a reference under which you want to list
  const listRef = ref(storage, auth.currentUser.uid);
  // Find all the prefixes and items.
  listAll(listRef)
    .then((res) => {
      render(recordingsList(res), $list);
    })
    .catch((error) => {
      render(warningBlock(error.message), $list);
    });

  // return html`${until(list, html`<span>Loading...</span>`)}`;
  return html`
    <section>
      <h2>Recordings</h2>
      ${$list}
    </section>
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
