import { dispatch } from "./util.js";

export class CaptureController extends EventTarget {
  #stream = null;
  #device = null;

  get stream() {
    return this.#stream;
  }

  constructor(device) {
    super();
    this.#device = device;
    setTimeout(() => dispatch(this, "inactive"));
  }

  async start(options) {
    if (this.#stream) {
      return;
    }
    try {
      this.#stream = await getStream(this.#device, options);
      this.#stream.addEventListener(
        "inactive",
        () => {
          dispatch(this, "inactive");
          this.#stream = null;
        },
        { once: true }
      );
      dispatch(this, "active");
    } catch (error) {
      dispatch(this, "error", error);
    }
  }

  stop(stream) {
    if (!this.#stream) {
      return;
    }
    this.#stream.getTracks().forEach((t) => t.stop());
  }
}

function getStream(device, options) {
  switch (device) {
    case "display":
      return getDisplayMedia(options);
    case "user":
      return getUserMedia(options);
  }
}

function getDisplayMedia(options) {
  return navigator.mediaDevices.getDisplayMedia({
    video: {
      displaySurface: "monitor",
    },
    ...options,
  });
}

function getUserMedia(options) {
  return navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
    ...options,
  });
}
