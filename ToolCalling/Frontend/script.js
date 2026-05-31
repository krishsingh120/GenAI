const input = document.querySelector("#input");
const chatContainer = document.querySelector("#chat-container");
const askBtn = document.querySelector("#ask");

/**
 * THREAD ID PERSIST
 */

let threadId = localStorage.getItem("threadId");

if (!threadId) {
  threadId =
    Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  localStorage.setItem("threadId", threadId);
}

/**
 * EVENTS
 */

input?.addEventListener("keydown", handleEnter);

askBtn?.addEventListener("click", handleAsk);

/**
 * LOADING ELEMENT
 */

const loading = document.createElement("div");

loading.className = "my-6 animate-pulse text-neutral-400";

loading.textContent = "Thinking...";

/**
 * GENERATE MESSAGE
 */

async function generate(text) {
  /**
   * USER MESSAGE UI
   */

  const msg = document.createElement("div");

  msg.className =
    "my-6 bg-neutral-800 p-3 rounded-xl ml-auto max-w-fit whitespace-pre-wrap";

  msg.textContent = text;

  chatContainer?.appendChild(msg);

  input.value = "";

  scrollToBottom();

  /**
   * DISABLE BUTTON
   */

  askBtn.disabled = true;

  /**
   * SHOW LOADING
   */

  chatContainer?.appendChild(loading);

  scrollToBottom();

  try {
    /**
     * CALL SERVER
     */

    const assistantMessage = await callServer(text);

    /**
     * ASSISTANT MESSAGE UI
     */

    const assistantMsgElem = document.createElement("div");

    assistantMsgElem.className =
      "max-w-fit bg-neutral-700 p-3 rounded-xl whitespace-pre-wrap";

    assistantMsgElem.textContent = assistantMessage;

    loading.remove();

    chatContainer?.appendChild(assistantMsgElem);
  } catch (err) {
    console.error(err);

    loading.remove();

    const errorElem = document.createElement("div");

    errorElem.className = "text-red-400 my-4";

    errorElem.textContent = "Something went wrong.";

    chatContainer?.appendChild(errorElem);
  } finally {
    askBtn.disabled = false;

    scrollToBottom();
  }
}

/**
 * API CALL
 */

async function callServer(inputText) {
  const response = await fetch("http://localhost:3000/chat", {
    method: "POST",

    headers: {
      "content-type": "application/json",
    },

    body: JSON.stringify({
      threadId,
      message: inputText,
    }),
  });

  if (!response.ok) {
    throw new Error("Error generating response");
  }

  const result = await response.json();

  return result.data;
}

/**
 * ASK BUTTON
 */

async function handleAsk() {
  const text = input?.value.trim();

  if (!text) return;

  await generate(text);
}

/**
 * ENTER + SHIFT ENTER
 */

async function handleEnter(e) {
  /**
   * SHIFT + ENTER
   * => NEW LINE
   */

  if (e.key === "Enter" && e.shiftKey) {
    return;
  }

  /**
   * NORMAL ENTER
   * => SEND MESSAGE
   */

  if (e.key === "Enter") {
    e.preventDefault();

    const text = input?.value.trim();

    if (!text) return;

    await generate(text);
  }
}

/**
 * AUTO SCROLL
 */

function scrollToBottom() {
  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: "smooth",
  });
}

// async function handleShiftPlusEnter(e) {
//   if (e.key === "Enter") {
//     const text = input?.value.trim();
//     if (!text) {
//       return;
//     }

//     await generate(text);
//   }
// }
