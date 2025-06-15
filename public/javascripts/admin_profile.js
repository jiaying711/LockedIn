const createUserForm = document.getElementById('createUserForm');
const avatarInput = document.getElementById('avatar');
const avatarPreview = document.getElementById('avatarPreview');
const emailInput = document.getElementById('emailInput');
const deleteBtn = document.getElementById('deleteBtn');
const editBtn = document.getElementById('editBtn');
let clickedAction = null;

window.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('/admin/isAdmin', {
      credentials: 'include' // necessary if you're using sessions
    });

    if (!res.ok) {
      throw new Error('Not authorized');
    }

    const data = await res.json();

    if (!data.isAdmin) {
      alert('Access denied. Admins only.');
      window.location.href = '/login.html';
    }

  } catch (err) {
    console.error('Admin check failed:', err);
    alert('You must be an admin to view this page.');
    window.location.href = '/login.html';
  }
});

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

function openModal(id) {
  document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  emailInput.value = '';
}

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

// Handle "Enter" key in email input as a Search
document.getElementById('emailInput').addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault(); // Prevent form submission
    const email = e.target.value.trim();

    if (!email) return alert('Please enter an email.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return alert('Invalid email format.');

    try {
      const response = await fetch('/admin/getUser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const user = await response.json();

      if (!response.ok) throw new Error(user.error);
      alert(`User found:\nUsername: ${user.username}\nEmail: ${user.email}`);
    } catch (err) {
      alert('Search failed: ' + err.message);
    }
  }
});

createUserForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(createUserForm);
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

  try {
    const response = await fetch('/admin/addUser', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message);
      closeModal('addUserModal');
    } else {
      alert(result.error || 'An error occurred.');
    }
  } catch (err) {
    console.error('Request failed:', err);
    alert("Network or server error.");
  }
});

document.getElementById('addBtn').addEventListener('click', () => {
  openModal('addUserModal');
});

deleteBtn.addEventListener('click', () => clickedAction = 'delete');
editBtn.addEventListener('click', () => clickedAction = 'edit');

document.getElementById('userControlForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  if (!validateEmail(email)) {
    alert('Invalid email');
    return;
  }

  if (clickedAction === 'delete') {
    openModal('confirmDeleteModal');
  }

  if (clickedAction === 'edit') {
    openModal('editUserModal');
    deleteBtn.classList.add('disabled');
    editBtn.classList.add('disabled');
    document.getElementById('listAllBtn').classList.add('disabled');
    document.getElementById('addBtn').classList.add('disabled');
  }

  clickedAction = null; // reset after action
});

document.getElementById('updateUserBtn').addEventListener('click', async () => {
  const username = document.getElementById('editUsername').value.trim();
  const email = document.getElementById('editUserEmail').value.trim();
  const originalEmail = document.getElementById('emailInput').value;

  try {
    const res = await fetch('/admin/editUser', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ username, email, originalEmail })
    });

    const result = await res.json();
    if (res.ok) {
      alert(result.message || 'User updated.');
      closeModal('editUserModal');
      deleteBtn.classList.remove('disabled');
      editBtn.classList.remove('disabled');
      document.getElementById('listAllBtn').classList.remove('disabled');
      document.getElementById('addBtn').classList.remove('disabled');
    } else {
      alert(result.error || 'Error updating user.');
    }
  } catch (err) {
    console.error('Update failed:', err);
    alert('Network or server error.');
  }
});

document.getElementById('listAllBtn').addEventListener('click', async () => {
  try {
    const res = await fetch('/admin/users');
    const users = await res.json();

    let output = 'Users:\n';
    users.forEach(u => {
      output += `ID:${u.id}; Username: ${u.username}; Email: ${u.email}\n`;
    });

    alert(output);
  } catch (err) {
    console.error(err);
    alert('Could not fetch users.');
  }
});

// Handle logout
document.getElementById('logoutLink').addEventListener('click', async () => {
  await fetch('/users/logout');
  window.location.href = '/login.html';
});

async function confirmDelete() {
  const email = emailInput.value;
  if (email === "admin@gmail.com") {
    alert("Admin cannot be deleted!");
    closeModal('confirmDeleteModal');
    return;
  }

  try {
    const response = await fetch(`/admin/deleteUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email }),
      credentials: 'include' // Ensure session is included
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || `Deleted user: ${email}`);
      closeModal('confirmDeleteModal');
    } else {
      alert(result.error || 'Error deleting user.');
    }
  } catch (err) {
    console.error('Delete request failed:', err);
    alert('Network or server error.');
  }
};