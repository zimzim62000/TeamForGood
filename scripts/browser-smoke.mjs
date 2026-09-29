const endpoint = process.argv[2] ?? "http://127.0.0.1:9223";
const targetUrl = process.argv[3] ?? "http://localhost:3000";
const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((item) => item.type === "page");
if (!target) throw new Error("Aucun onglet Chrome débogable.");

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const errors = [];
socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
  if (message.method === "Runtime.exceptionThrown") {
    errors.push(message.params.exceptionDetails.text + ": " + (message.params.exceptionDetails.exception?.description ?? ""));
  }
  if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
    errors.push(message.params.args.map((item) => item.value ?? item.description).join(" "));
  }
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve) => pending.set(id, resolve));
}

await send("Runtime.enable");
await send("Page.enable");
await send("Page.navigate", { url: targetUrl });
await new Promise((resolve) => setTimeout(resolve, 3000));
await send("Runtime.evaluate", {
  expression: `(() => {
    const input = document.querySelector('input[aria-label="Prénom ou pseudo local"]');
    if (input) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, 'ChromeSmoke');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    document.querySelector('form button')?.click();
  })()`,
});
await new Promise((resolve) => setTimeout(resolve, 600));
for (let index = 0; index < 5; index += 1) {
  await send("Input.dispatchKeyEvent", { type: "keyDown", code: "Space", key: " ", windowsVirtualKeyCode: 32 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", code: "Space", key: " ", windowsVirtualKeyCode: 32 });
  await new Promise((resolve) => setTimeout(resolve, 350));
}
const evaluation = await send("Runtime.evaluate", {
  expression: `(() => {
    const canvas = document.querySelector('canvas');
    const status = document.querySelector('[role="status"]')?.textContent;
    if (!canvas) return { canvas: false, status };
    const pixel = Array.from(canvas.getContext('2d').getImageData(10, 10, 1, 1).data);
    const button = document.querySelector('form button')?.textContent;
    const title = document.querySelector('strong')?.textContent;
    return { canvas: true, width: canvas.width, height: canvas.height, pixel, status, button, title };
  })()`,
  returnByValue: true,
});
socket.close();

const result = evaluation.result?.result?.value;
console.log(JSON.stringify({ result, errors }, null, 2));
if (!result?.canvas || errors.length) process.exitCode = 1;
