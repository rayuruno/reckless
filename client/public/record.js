import { wait, dispatch } from "./util.js";

export class RecordController extends EventTarget {
  #stream = null;
  #recorder = null;

  get stream() {
    return this.#stream;
  }

  start(mediaStream) {
    if (this.#recorder) {
      return;
    }
    this.#recorder = newMediaRecorder(mediaStream);
    this.#stream = getStream(this.#recorder);
    this.#recorder.addEventListener("start", this.#onStart, { once: true });
    this.#recorder.addEventListener("stop", this.#onStop, { once: true });
    this.#recorder.addEventListener("error", this.#onError, { once: true });
  }

  stop() {
    if (!this.#recorder) {
      return;
    }
    this.#recorder.stop();
  }

  #onStart = () => dispatch(this, "active");

  #onStop = () => {
    this.#recorder = null;
    this.#stream = null;
    dispatch(this, "inactive");
  };

  #onError = () => {
    this.#recorder.removeEventListener("stop", this.#onStop);
    this.#recorder = null;
    this.#stream = null;
    dispatch(this, "error");
  };
}

function getStream(recorder, timeslice = 1000) {
  return new ReadableStream({
    closed: false,

    start(ctrl) {
      recorder.addEventListener("dataavailable", async (ev) => {
        if (this.closed) {
          return;
        }

        try {
          if (ev.data.size === 0) return;
          let ab = await ev.data.arrayBuffer();
          await ctrl.enqueue(new Uint8Array(ab));
        } catch (error) {
          if (error) {
            console.error(error);
          }
        }
      });

      recorder.addEventListener(
        "stop",
        async () => {
          if (this.closed) {
            recorder.dispatchEvent(new Event("error"));
            return;
          }

          await wait(timeslice);

          try {
            await ctrl.close();
          } catch (error) {
            if (error) {
              console.error(error);
            }
          }
        },
        { once: true }
      );

      recorder.start(timeslice);
    },

    cancel() {
      this.closed = true;
      if (recorder.state === "recording") {
        recorder.stop();
      }
    },

    error(error) {
      console.error(error);
      this.closed = true;
      if (recorder.state === "recording") {
        recorder.stop();
      }
    },
  });
}

function newMediaRecorder(mediaStream, options = null) {
  return new MediaRecorder(mediaStream, getOptions(mediaStream, options));
}

function getOptions(mediaStream, options) {
  return {
    audioBitsPerSecond: 6000,
    videoBitsPerSecond: 500000,
    mimeType: getMimeType(mediaStream),
    ...options,
  };
}

function getMimeType(mediaStream) {
  let preferedTypes;
  let hv = hasVideo(mediaStream);
  let ha = hasAudio(mediaStream);
  if (hv && ha) {
    preferedTypes = [
      `video/webm;codecs="vp8,opus"`,
      `video/webm;codecs="vp8,vorbis"`,
    ];
  } else if (hv) {
    preferedTypes = [`video/webm;codecs="vp9"`, `video/webm;codecs="vp8"`];
  } else if (ha) {
    preferedTypes = [`video/webm;codecs="opus"`, `video/webm;codecs="vorbis"`];
  }
  const mimeType = preferedTypes.find((c) => MediaRecorder.isTypeSupported(c));
  if (!mimeType) {
    throw new Error("unsupported mime type");
  }
  return mimeType;
}

function hasVideo(mediaStream) {
  return mediaStream.getVideoTracks().length > 0;
}

function hasAudio(mediaStream) {
  return mediaStream.getAudioTracks().length > 0;
}
