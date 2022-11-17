import './scss/style.scss';

document.addEventListener("DOMContentLoaded", async () => {
  const HOST = "http://localhost:4000";
  const storage = sessionStorage.userinfo
    ? JSON.parse(sessionStorage.userinfo)
    : {};
  const list = document.querySelector(".project__project-list");

  const logoutButton = document.querySelector(".header__logout-button");
  const loginButton = document.querySelector(".header__login-button");
  const registrationButton = document.querySelector(".header__registration-button");

  const authorization = document.querySelector(".authorization");
  const errorLogin = document.querySelector(".authorization__error-message");

  const registration = document.querySelector(".registration");

  const loginForm = document.querySelector(".authorization__login-form");
  const registrationForm = document.querySelector('.registration__login-form');
  const registrationFormElements = document.querySelectorAll('.registration__login-input');
  const errorRegistrationMessage = document.querySelector('.registration__error-message');


  const projectArea = document.querySelector(".project") ;
  const projectForm = document.querySelector(".project__task-form");


  function classToggle(neededButton, buttonToHide, neededForm, formToHide) {
    neededButton.classList.toggle('disable');
    buttonToHide.classList.toggle('disable')
    neededForm.classList.toggle('disable');
    formToHide.classList.toggle('disable');
  }

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


    registrationFormElements.forEach(function(item) {
      if (!item.value) {
        item.closest('label').querySelector('.registration__input-message').innerText = `*This field is required`
      } else {
        item.closest('label').querySelector('.registration__input-message').innerText = ``
      }

    })

    const body = new FormData(registrationForm);

    const response = await fetch(`${HOST}/register`, {
      method: "POST",
      body,
    })


    if (response.status !== 200){
      errorRegistrationMessage.classList.toggle('disable');
      errorRegistrationMessage.innerText = '*This user is already exists!'

    } else {

      const result = await fetch(`${HOST}/login`, {
        method: "POST",
        body,
      });

      const { token } = await result.json();
      storage.token = token;
      sessionStorage.userinfo = JSON.stringify(storage);

      classToggle(logoutButton, loginButton, projectArea, registration);
      registrationForm.reset();
    }

  });


  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const body = new FormData(loginForm);

    const result = await fetch(`${HOST}/login`, {
      method: "POST",
      body,
    });

    const { token } = await result.json();

    if (token === undefined) {
      console.log('try again')
      errorLogin.classList.toggle('disable')
      errorLogin.innerText = "*This user does not exist! Try again or make a registration."

    } else {
      loginForm.reset()
      projectArea.classList.remove('disable');
      authorization.classList.add('disable');
      logoutButton.classList.toggle('disable');
      registrationButton.classList.add('disable');

      storage.token = token;
      sessionStorage.userinfo = JSON.stringify(storage);

      await renderTasks();

      console.log('success')
    }

  });



  projectForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const projectName = document.querySelector('.project__task-input-name');
    const projectDate = document.querySelector('.project__task-input-date');

    if (!projectName.value || ! projectDate.value){
      document.querySelector(".project__task-error-message").innerText = `*All fields is required`
    } else {
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
      const yearDate = [year, month.toString().padStart(2,'0'), day.toString().padStart(2,'0')].join('-');

      listItem.innerText = `${name} ---- ${yearDate}`;
      list.append(listItem);
    });
  }

});
