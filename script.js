// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const db = firebase.firestore();
const auth = firebase.auth();

// DOM elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app');
const loginEmailInput = document.getElementById('login-email');
const loginPasswordInput = document.getElementById('login-password');
const loginButton = document.getElementById('login-button');
const registerEmailInput = document.getElementById('register-email');
const registerPasswordInput = document.getElementById('register-password');
const registerButton = document.getElementById('register-button');
const logoutButton = document.getElementById('logout-button');
const projectNameInput = document.getElementById('project-name');
const addProjectButton = document.getElementById('add-project-button');
const projectList = document.getElementById('project-list');
const tasksColumn = document.getElementById('tasks-column');
const tasksHeader = document.getElementById('tasks-header');
const taskNameInput = document.getElementById('task-name');
const addTaskButton = document.getElementById('add-task-button');
const taskList = document.getElementById('task-list');

let currentProjectId = null;

// Register new users
registerButton.addEventListener('click', () => {
  const email = registerEmailInput.value;
  const password = registerPasswordInput.value;
  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      console.log('User registered:', userCredential.user);
    })
    .catch((error) => {
      console.error('Registration error:', error);
    });
});

// Login existing users
loginButton.addEventListener('click', () => {
  const email = loginEmailInput.value;
  const password = loginPasswordInput.value;
  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      // Signed in
      console.log('User logged in:', userCredential.user);
    })
    .catch((error) => {
      console.error('Login error:', error);
    });
});

// Logout user
logoutButton.addEventListener('click', () => {
  auth.signOut().then(() => {
    console.log('User logged out');
  });
});

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    // User is signed in
    authContainer.style.display = 'none';
    appContainer.style.display = 'block';
    loadProjects(user.uid);
  } else {
    // User is signed out
    authContainer.style.display = 'block';
    appContainer.style.display = 'none';
    projectList.innerHTML = '';
  }
});

// Add project
addProjectButton.addEventListener('click', () => {
    const projectName = projectNameInput.value;
    const user = auth.currentUser;

    if (projectName.trim() !== '' && user) {
        db.collection('projects').add({
            name: projectName,
            owner: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            projectNameInput.value = '';
        }).catch(error => {
            console.error('Error adding project: ', error);
        });
    }
});

// Load projects
function loadProjects(uid) {
    db.collection('projects').where('owner', '==', uid).orderBy('createdAt', 'desc')
        .onSnapshot((querySnapshot) => {
            projectList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const project = doc.data();
                const li = document.createElement('li');

                const projectNameSpan = document.createElement('span');
                projectNameSpan.textContent = project.name;
                projectNameSpan.style.cursor = 'pointer';
                projectNameSpan.addEventListener('click', () => selectProject(doc.id, project.name));

                li.dataset.id = doc.id;
                li.appendChild(projectNameSpan);

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', (e) => { e.stopPropagation(); deleteProject(doc.id); });

                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', (e) => { e.stopPropagation(); updateProject(doc.id, project.name); });

                li.appendChild(updateButton);
                li.appendChild(deleteButton);
                projectList.appendChild(li);
            });
        });
}

function selectProject(projectId, projectName) {
    currentProjectId = projectId;
    tasksColumn.style.display = 'block';
    tasksHeader.textContent = `Tasks for ${projectName}`;
    loadTasks(projectId);
}

// Delete project
function deleteProject(id) {
    db.collection('projects').doc(id).delete().catch(error => {
        console.error('Error removing project: ', error);
    });
}

// Update project
function updateProject(id, currentName) {
    const newName = prompt('Enter new project name', currentName);
    if (newName && newName.trim() !== '') {
        db.collection('projects').doc(id).update({ name: newName }).catch(error => {
            console.error('Error updating project: ', error);
        });
    }
}

// Add task
addTaskButton.addEventListener('click', () => {
    const taskName = taskNameInput.value;
    if (taskName.trim() !== '' && currentProjectId) {
        db.collection('tasks').add({
            name: taskName,
            projectId: currentProjectId,
            status: 'To Do',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            taskNameInput.value = '';
        }).catch(error => {
            console.error('Error adding task: ', error);
        });
    }
});

// Load tasks
function loadTasks(projectId) {
    db.collection('tasks').where('projectId', '==', projectId).orderBy('createdAt', 'desc')
        .onSnapshot((querySnapshot) => {
            taskList.innerHTML = '';
            querySnapshot.forEach((doc) => {
                const task = doc.data();
                const li = document.createElement('li');
                li.textContent = `${task.name} [${task.status}]`;
                li.dataset.id = doc.id;

                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteTask(doc.id));

                const updateButton = document.createElement('button');
                updateButton.textContent = 'Update';
                updateButton.addEventListener('click', () => updateTask(doc.id, task.name, task.status));

                li.appendChild(updateButton);
                li.appendChild(deleteButton);
                taskList.appendChild(li);
            });
        });
}

// Delete task
function deleteTask(id) {
    db.collection('tasks').doc(id).delete().catch(error => {
        console.error('Error removing task: ', error);
    });
}

// Update task
function updateTask(id, currentName, currentStatus) {
    const newName = prompt('Enter new task name', currentName);
    const newStatus = prompt('Enter new status (e.g., To Do, In Progress, Completed)', currentStatus);
    if (newName && newName.trim() !== '') {
        db.collection('tasks').doc(id).update({
            name: newName,
            status: newStatus
        }).catch(error => {
            console.error('Error updating task: ', error);
        });
    }
}

console.log("Project Management App is running!");