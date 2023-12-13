const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const app = express();
require('dotenv').config();
const Person = require('./models/person.js');
const PORT = process.env.PORT || 3001;

app.use(express.json());
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(
  morgan(':method :url :status :res[content-length] - :response-time ms :body')
);
app.use(cors());
app.use(express.static('dist'));

const errorHandler = (error, request, response, next) => {
  console.error(error.message)

  if (error.name === 'CastError') {
    return response.status(400).send({ error: 'malformatted id' })
  }
  else if (error.name === 'ValidationError') {
    return response.status(400).json({ error: error.message })
  }

  next(error)
}
const unknownEndpoint = (request, response) => {
  response.status(404).send({ error: 'unknown endpoint' });
};

app.get('/api/persons', (req, res, next) => {
  Person.find({}).then((persons) => {
    res.json(persons);
  }).catch(err => next(err));
});

app.get('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findById(id).then((person) => {
    if(person) {
      res.json(person);
    } else {
      res.status(404).end();
    }
  }).catch(err => next(err));
});

app.delete('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndDelete(id).then(() => {
    res.status(204).end();
  }).catch(err => next(err));
});

app.post('/api/persons', (req, res, next) => {
  const body = req.body;
  const person = new Person ({
    name: body.name,
    number: body.number,
  });
  person.save().then((savedPerson) => {
    res.json(savedPerson);
  }).catch(err => next(err));
});

app.put('/api/persons/:id', (req, res, next) => {
  const id = req.params.id
  Person.findByIdAndUpdate(id, req.body, { new: true, runValidators: true, context: 'query' })
    .then((updatedPerson) => {
      res.json(updatedPerson);
    })
    .catch((err) => next(err));
});

app.use(unknownEndpoint);
app.use(errorHandler);

app.get('/info', (req, res) => {
  const date = new Date();
  Person.find({}).then((persons) => {
    res.send(
      `<p>Phonebook has info for ${persons.length} people</p><p>${date}</p>`
    );
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
