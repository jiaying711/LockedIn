const loginForm = document.getElementById('loginForm');
const signupForm = document.getElementById('signupForm');
const toggleLink = document.getElementById('toggleLink');
const formTitle = document.getElementById('formTitle');
const avatarInput = document.getElementById('signup-avatar');
const avatarPreview = document.getElementById('avatarPreview');

toggleLink.addEventListener('click', () => {
  // toggle add the class active if it's not present and remove if it's present
  loginForm.classList.toggle('active');
  signupForm.classList.toggle('active');
  if (loginForm.classList.contains('active')) {
    formTitle.textContent = 'Login';
    toggleLink.textContent = "Don't have an account? Sign up";
  } else {
    formTitle.textContent = 'Sign Up';
    toggleLink.textContent = "Already have an account? Log in";
  }
});

// preview for avatar if any
if (avatarInput) {
  avatarInput.addEventListener('change', () => {
    const file = avatarInput.files[0];
    if (file) {
      avatarPreview.src = URL.createObjectURL(file);
      avatarPreview.classList.remove('hidden');
    } else {
      avatarPreview.classList.add('hidden');
    }
  });
}

// input validation utility function
function validateField(name, value, min = 3, max = 50) {
  if (typeof value !== 'string' || value.length < min || value.length > max) {
    alert(`${name} must be a string between ${min}-${max} characters`);
    return false;
  }
  if (/<script.*?>|<\/script>/gi.test(value)) {
    alert(`${name} contains unsafe characters`);
    return false;
  }
  return true;
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(loginForm);
  const data = Object.fromEntries(formData.entries());

  // input validation
  if (!validateField('Username', data.username) || !validateField('Password', data.password, 6)) return;

  const xhttp = new XMLHttpRequest();
  xhttp.open('POST', '/users/login');
  xhttp.withCredentials = true; // required to send session cookie
  xhttp.setRequestHeader('Content-Type', 'application/json');

  xhttp.onload = () => {
    const result = JSON.parse(xhttp.responseText);
    alert(result.message || result.error);
    // redirect back to home page if log in successful
    if (result.message && result.message.startsWith('Welcome')) {
      // window.vueinst.loggedIn
      window.location.href = "/";
    } else {
      document.getElementById('login-password').value = '';
    }
  };

  xhttp.onerror = () => {
    alert('Network error during login.');
  };

  xhttp.send(JSON.stringify(data));
});

signupForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(signupForm);
  const data = Object.fromEntries(formData.entries());

  // input validation
  if (
    !validateField('Username', data.username)
    || !validateField('Password', data.password, 6)
    || !validateField('Email', data.email, 5, 50)
  ) return;
  if (!validateEmail(data.email)) {
    alert('Invalid email format');
    return;
  }

  const xhttp = new XMLHttpRequest();
  xhttp.open('POST', '/users/signup');
  xhttp.setRequestHeader('Content-Type', 'application/json');

  xhttp.onload = () => {
    console.log('status:', xhttp.status);
    console.log('response:', xhttp.responseText);
    const result = JSON.parse(xhttp.responseText);
    alert(result.message || result.error);
    // redirect back to login page if sign up successful
    if (result.message === "Signup successful!" || result.error === "Username already exists") {
      window.location.href = "/login.html";
    }
  };
  xhttp.onerror = () => {
    alert('Network error during signup.');
  };
  // xhttp.send(formData); no more avatar
  xhttp.send(JSON.stringify(data));

});
