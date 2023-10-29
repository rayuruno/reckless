import { CaptureController } from "./capture.js";
import { RecordController } from "./record.js";
import { UploadController } from "./upload.js";

export class RecButton extends HTMLElement {
  #shadowRoot = null;
  #stop = null;
  constructor() {
    super();

    this.#shadowRoot = this.attachShadow({
      mode: "closed",
      delegatesFocus: true,
    });
    this.#shadowRoot.innerHTML = `
    <style>
    :host {
      position: relative;
      font-family: sans-serif;
      font-size: 1rem;
      line-height: 1.5;
    }
    .state {
      position: absolute;
      opacity: 0;
      transition: opacity .2s;
    }
    svg {
      width: 24px;
      height: 24px;
      vertical-align: middle;
    }
    .hidden {
      display: none;
    }
    button {
      all: unset;
      cursor: pointer;
    }

    [data-device=user] .display,
    [data-device=display] .user {
      display: none;
    }

    [data-device=user] .user {
      transform: transform3d(0,24px,0)
    }

    [data-capture="inactive"] .capture .inactive,
    [data-capture="active"] .capture .active {
      opacity: 1;
    }

    .record {
      transform: translate3d(24px,0,0)
    }
    [data-record="inactive"] .record .inactive,
    [data-record="active"] .record .active,
    [data-record="error"] .record .error {
      opacity: 1;
    }

    .upload {
      transform: translate3d(24px,0,0)
    }
    [data-upload="request"] .upload .request {
      opacity: 1;
    }

    .warning {
      transform: translate3d(0, 24px,0)
    }
    .warning .message {
      vertical-align: middle;
    }
    [data-capture="error"] .warning,
    [data-record="error"] .warning,
    [data-upload="error"] .warning {
      opacity: 1;
    }
    
    </style>
    <main data-capture="inactive" data-record="inactive" data-upload="inactive">
    <button>
      <div class="capture">
        <svg class="display state active" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M320-400h80v-80q0-17 11.5-28.5T440-520h80v80l120-120-120-120v80h-80q-50 0-85 35t-35 85v80ZM80-120q-17 0-28.5-11.5T40-160q0-17 11.5-28.5T80-200h800q17 0 28.5 11.5T920-160q0 17-11.5 28.5T880-120H80Zm80-120q-33 0-56.5-23.5T80-320v-440q0-33 23.5-56.5T160-840h640q33 0 56.5 23.5T880-760v440q0 33-23.5 56.5T800-240H160Zm0-80h640v-440H160v440Zm0 0v-440 440Z"/></svg>
        <svg class="display state inactive" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M577-497 474-600h46v-80l120 120-63 63Zm251 251-74-74h46v-440H314l-80-80h566q33 0 56.5 23.5T880-760v440q0 26-14.5 45.5T828-246Zm-8 218-92-92H40v-80h607l-40-40H160q-33 0-56.5-23.5T80-320v-446l-52-54 56-56L876-84l-56 56ZM400-446v46h-80v-80q0-11 1-21t6-19L160-687v367h366L400-446Zm134-94Zm-191 36Z"/></svg>

        <svg class="user state active" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z"/></svg>
        <svg class="user state inactive" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M160-160q-33 0-56.5-23.5T80-240v-480q0-33 23.5-56.5T160-800h480q33 0 56.5 23.5T720-720v180l160-160v440L720-420v180q0 33-23.5 56.5T640-160H160Zm0-80h480v-480H160v480Zm0 0v-480 480Z"/></svg>
      </div>
    </button>
    <div class="record">
      <svg class="state error" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
      <svg class="state active" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280v-400q-83 0-141.5 58.5T280-480q0 83 58.5 141.5T480-280Zm0 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
    </div>
    <div class="upload">
      <svg class="state request" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M480-280q83 0 141.5-58.5T680-480q0-83-58.5-141.5T480-680q-83 0-141.5 58.5T280-480q0 83 58.5 141.5T480-280Zm0 200q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>
    </div>
    <div class="state warning">
      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>
      <span class="message"></span>
    </div>
    </main>
    `;
  }
  connectedCallback() {
    let cap = new CaptureController(this.dataset.device);
    let rec = new RecordController();
    let upl = new UploadController(this.dataset.url);

    upl.addEventListener("request", this.#update);
    upl.addEventListener("response", this.#update);
    upl.addEventListener("error", this.#update);

    rec.addEventListener("active", (e) => {
      this.#update(e);
      upl
        .ready()
        .then((ok) => ok && upl.start(this.dataset.device, rec.stream));
    });
    rec.addEventListener("inactive", (e) => {
      this.#update(e);
      upl.retry = false;
    });
    rec.addEventListener("error", (e) => {
      this.#update(e);
      rec.start(cap.stream);
    });

    cap.addEventListener("active", (e) => {
      this.#update(e);
      upl.retry = true;
      rec.start(cap.stream);
    });
    cap.addEventListener("inactive", this.#update);
    cap.addEventListener("error", this.#update);

    this.#shadowRoot.querySelector("button").addEventListener("click", () => {
      if (cap.stream) {
        cap.stop();
      } else {
        cap.start();
      }
    });

    this.#stop = () => cap.stop();

    let $main = this.#shadowRoot.querySelector("main");
    $main.dataset.device = this.device;
  }
  disconnectedCallback() {
    this.#stop();
  }
  #update = (e) => {
    let cls = e.target.constructor.name.toLowerCase().replace("controller", "");
    let $main = this.#shadowRoot.querySelector("main");
    $main.dataset.device = this.device;
    $main.dataset[cls] = e.type;
    if (e.type === "error" && e.detail) {
      this.#shadowRoot.querySelector(".message").textContent = e.detail.message;
    }
  };
}

customElements.define("rec-button", RecButton);
