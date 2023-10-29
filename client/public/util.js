import { nanoid } from "./nanoid.js";

export const wait = (timeout) =>
  new Promise((resolve) => setTimeout(resolve, timeout));

export const dispatch = (target, type, detail) =>
  target.dispatchEvent(new CustomEvent(type, { detail }));

export const getSessionId = () => {
  let sid = localStorage.getItem("sessionId");
  if (!sid) {
    sid = nanoid();
    localStorage.setItem("sessionId", sid);
  }
  return sid;
};
