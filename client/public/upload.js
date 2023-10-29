import { wait, dispatch, getSessionId } from "./util.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";

export class UploadController extends EventTarget {
  #url = null;
  #sid = null;
  constructor(url) {
    super();
    this.#url = url;
    this.#sid = getSessionId();
  }
  async start(name, stream) {
    const auth = getAuth();
    if (!auth.currentUser) {
      return;
    }
    let idToken;
    try {
      idToken = await auth.currentUser.getIdToken(true);
    } catch (error) {
      dispatch(this, "error", error);
      return;
    }

    this.retry = true;

    let request = fetch(
      `${this.#url}/record/${this.#sid}/${name}/${Date.now()}.webm`,
      {
        method: "POST",
        body: stream,
        headers: { "X-Token": idToken },
        duplex: "half",
      }
    )
      .then((response) => {
        dispatch(this, "response", response);
      })
      .catch((error) => {
        dispatch(this, "error", error);
      });

    dispatch(this, "request", request);
  }
  async ready(timeout = 1000) {
    if (!this.retry) return false;

    try {
      await fetch(`${this.#url}`, { method: "GET" });
      return true;
    } catch (error) {
      await wait(timeout);
      return this.ready(timeout);
    }
  }
}
