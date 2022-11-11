document.addEventListener("DOMContentLoaded", async () => {
  const form = document.querySelector(".login");
  const list = document.querySelector("ul");
  const logoutButton = document.querySelector(".logout");
  const HOST = "http://localhost:4000";
  const storage = sessionStorage.userinfo
    ? JSON.parse(sessionStorage.userinfo)
    : {};

  logoutButton.addEventListener("click", () => {
    list.innerHTML = "";
    delete sessionStorage.userinfo;
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = new FormData(form);

    const result = await fetch(`${HOST}/login`, {
      method: "POST",
      body,
    });
    const { token } = await result.json();
    storage.token = token;
    sessionStorage.userinfo = JSON.stringify(storage);
    await renderTasks();
  });

  if (storage.token) {
    await renderTasks();
  }

  async function renderTasks() {
    const request = await fetch(`${HOST}/tasks`, {
      headers: {
        token: storage.token,
      },
    });
    const tasks = await request.json();
    tasks.forEach(({ name, deadline }) => {
      const listItem = document.createElement("li");

      listItem.innerText = `${name} ---- ${deadline}`;
      list.append(listItem);
    });
  }
});
