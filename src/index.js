const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function findUser(username) {
  const userNameRegex = new RegExp(username, 'i')
  const userAlreadyExist = users.find((user) => userNameRegex.test(user.username))

  return userAlreadyExist
}

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;
  const userAlreadyExist = findUser(username)
  if (!userAlreadyExist) return response.status(401).json({ error: 'unauthorized user' })
  request.user = userAlreadyExist
  next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExist = findUser(username)

  if (userAlreadyExist) return response.status(400).json({ error: 'username already exist'})

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(newUser)

  return response.status(201).json(newUser)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { username } = request.headers;
  
  const getUser = findUser(username);

  return response.status(200).json(getUser.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { username } = request.headers;

  const todoBody = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  }
  const userNameRegex = new RegExp(username,'i')

  users.forEach((user) => {
    if (userNameRegex.test(user.username)) {
      user.todos.push(todoBody)
    }
  })

  return response.status(201).json(todoBody)
});

app.put('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { id } = request.params;
  const { username } = request.headers
  const { user } = request;

  const savedTodo = user.todos.find((todo) => todo.id === id)

  if (!savedTodo) return response.status(404).json({ error: 'todo not found'})
  
  const newTodo = {
    ...savedTodo,
    title,
    deadline: new Date(deadline)
  }

  const userTodoWithoutNewTodo = user.todos.filter((todo) => todo.id !== id)

  const newTodos = [...userTodoWithoutNewTodo, newTodo];

  users.forEach((user) => {
    if (user.username === username) user.todos = newTodos
  })

  return response.status(200).json(newTodo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers
  const { user } = request;

  const savedTodo = user.todos.find((todo) => todo.id === id)

  if (!savedTodo) return response.status(404).json({ error: 'todo not found'})
  
  const newTodo = {
    ...savedTodo,
    done: true
  }

  const userTodoWithoutNewTodo = user.todos.filter((todo) => todo.id !== id)

  const newTodos = [...userTodoWithoutNewTodo, newTodo];

  users.forEach((user) => {
    if (user.username === username) user.todos = newTodos
  })

  return response.status(200).json(newTodo)
});

app.delete('/todos/:id', checksExistsUserAccount, (request, response) => {
  const { id } = request.params;
  const { username } = request.headers
  const { user } = request;

  const savedTodo = user.todos.some((todo) => todo.id === id)

  if (!savedTodo) return response.status(404).json({ error: 'todo not found'})

  const userTodoWithoutNewTodo = user.todos.filter((todo) => todo.id !== id)

  users.forEach((user) => {
    if (user.username === username) user.todos = userTodoWithoutNewTodo
  })

  return response.status(204).json(userTodoWithoutNewTodo)
});

module.exports = app;