import './scss/style.scss';

window.onload = preload();

function preload() {
  document.body.classList.add('loaded-hiding');
   return window.setTimeout(function () {
    document.body.classList.add('loaded');
    document.body.classList.remove('loaded-hiding');
  }, 700);
}

document.addEventListener("DOMContentLoaded", async () => {
  const HOST = "http://localhost:4000";
  const storage = sessionStorage.userinfo
    ? JSON.parse(sessionStorage.userinfo)
    : {};
  const list = document.querySelector(".project__project-list");
  const logoutButton = document.querySelector(".header__logout-button");
  const loginButton = document.querySelector(".header__login-button");
  const registrationButton = document.querySelector(".header__registration-button");
  const registration = document.querySelector(".registration");
  const authorization = document.querySelector(".authorization");
  const projectArea = document.querySelector(".project") ;
  const projectForm = document.querySelector(".project__task-form");
  const loginForm = document.querySelector(".authorization__login-form");
  const registrationForm = document.querySelector('.registration__login-form');
  const errorRegistrationMessage = document.querySelector('.registration__error-message');
  const errorLogin = document.querySelector(".authorization__error-message");

  logoutButton.addEventListener("click", () => {
    list.innerHTML = "";
    delete sessionStorage.userinfo;
    classToggle(registrationButton, logoutButton, authorization, projectArea);
  });

  registrationButton.addEventListener("click", () => {
    classToggle(loginButton, registrationButton, registration, authorization)
  });

  loginButton.addEventListener("click", () => {
    classToggle(registrationButton, loginButton, authorization, registration)
  });


  registration.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!registrationForm.email.value || !registrationForm.password.value) {
      errorRegistrationMessage.classList.remove('disable');
      return errorRegistrationMessage.innerText = "*All fields are required";
    }

    const body = new FormData(registrationForm);

    try {

      const response = await fetch(`${HOST}/register`, {
        method: "POST",
        body,
      })

      if (response.status !== 200){

        let registerError = new Error("This user is already exists");
        errorRegistrationMessage.classList.remove('disable');
        errorRegistrationMessage.innerText = registerError.message;

        throw registerError;

      } else {

        const result = await fetch(`${HOST}/login`, {
          method: "POST",
          body,
        });

        let answer = await result.json();
        const token  = answer.token;
        const email = answer.email

        storage.token = token;
        sessionStorage.userinfo = JSON.stringify(storage);

        const helloTitle = document.querySelector('.project__hello-title');
        helloTitle.innerHTML = `Hello, ${email}!`;

        classToggle(logoutButton, loginButton, projectArea, registration);
        registrationForm.reset();
        errorRegistrationMessage.classList.add('disable');
        errorRegistrationMessage.innerText = ``;
      }
    }
    catch (error){
      console.log(error)
    }
  });


  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const body = new FormData(loginForm);

    if (!loginForm.email.value || !loginForm.password.value) {

      errorLogin.classList.remove('disable');
      return errorLogin.innerText = "*All fields are required";
    }

    try {

      const result = await fetch(`${HOST}/login`, {
        method: "POST",
        body,
      });

      const answer = await result.json();
      const token  = answer.token;
      const email = answer.email

      storage.token = token;
      sessionStorage.userinfo = JSON.stringify(storage);

      if (token) {

        loginForm.reset();
        errorLogin.innerText = ``;
        errorLogin.classList.add('disable');
        classToggle(registrationButton, logoutButton, projectArea, authorization);

        const helloTitle = document.querySelector('.project__hello-title');
        helloTitle.innerHTML = `Hello, ${email}!`;

        await renderTasks();

      } else {

        let loginError = new Error("This user does not exist! Try again or make a registration")
        errorLogin.classList.remove('disable');
        errorLogin.innerText = loginError.message;

        throw loginError
      }

    } catch (error)  {
      console.log(error)
    }
  });


  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const projectName = document.querySelector('.project__task-input-name');
    const projectDate = document.querySelector('.project__task-input-date');

    if (!projectName.value || ! projectDate.value){
      document.querySelector(".project__task-error-message").innerText = `*All fields are required`
    } else {

      preload();

      document.querySelector(".project__task-error-message").innerText = ``;

      const body = new FormData(projectForm);

      await fetch(`${HOST}/tasks`, {
        method: "POST",
        body,
        headers: {
          token: storage.token,
        },
      });

      projectForm.reset();
      list.innerHTML= ``;

      await renderTasks();
    }
  });


  async function renderTasks() {
    const request = await fetch(`${HOST}/tasks`, {
      headers: {
        token: storage.token,
      },
    });
    const tasks = await request.json();

    tasks.forEach(({ name, deadline }) => {
      const listItem = document.createElement("li");
      const date = new Date(Date.parse(deadline))
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDay();
      const yearDate = [day.toString().padStart(2,'0'), month.toString().padStart(2,'0'), year].join('-');

      listItem.innerText = `${name} - - deadline - - ${yearDate}`;

      list.append(listItem);
    });
  }

  function classToggle(neededButton, buttonToHide, neededForm, formToHide) {
    neededButton.classList.toggle('disable');
    buttonToHide.classList.toggle('disable')
    neededForm.classList.toggle('disable');
    formToHide.classList.toggle('disable');
  }
});
