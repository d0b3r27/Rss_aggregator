import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import render from './render.js'
import parser from './parser.js'

export default () => {
  const elements = {
    input: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    submitButton: document.querySelector('form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
  };

  const initialState = {
    form: {
      status: 'filling',
      url: '',
      isValid: '',
      error: '',
    },
    posts: [],
    feeds: [],
    data: '',
  };

  const schema = yup
  .string()
  .url('Неверный формат URL')
  .required('URL обязателен')
  .test('unique',
      'RSS уже существует',
      (value) => !watchedState.feeds.includes(value));

  const validate = (url) => {
    return schema.validate(url)
    .then(watchedState.form.isValid = true)
    .catch((error) => {
      watchedState.form.error = error.message;
      watchedState.form.isValid = false;
    });
  };

  const getData = (url) => {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}&disableCache=true`;
    return axios.get(proxyUrl)
    .then((response) => response.data.contents)
    .catch((error) => watchedState.form.error = error.message);
  }

  const watchedState = onChange(initialState, render(elements, initialState));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputValue = formData.get('url');
    validate(inputValue)
    .then(() => {
      if (watchedState.form.isValid) {
        watchedState.form.status = 'sending';
        getData(inputValue)
        .then((data) => {
          watchedState.data = parser(data);
          console.log(data);
          watchedState.feeds.push(inputValue);
          watchedState.form.status = 'success';
        })
      }
    })
  });
};

