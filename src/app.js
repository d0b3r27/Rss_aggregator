import * as yup from 'yup';
import onChange from 'on-change';
import axios from 'axios';
import render from './view.js';
import parser from './parser.js';

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
    loadingProcess: {
      status: 'idle',
      error: '',
    },
    parser: {
      data: '',
      error: '',
    },
    posts: [],
    feeds: [],
    data: '',
  };

  // Схема валидации
  const schema = yup
    .string()
    .url('Неверный формат URL')
    .required('URL обязателен');
    // .test('unique', 'RSS уже существует', (value) => !watchedState.feeds.includes(value));

  // Валидатор
  const validate = (url) => schema.validate(url)
    .then(() => true)
    .catch((error) => error.message);

  // Добавление Proxy к URL
  const addProxy = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  // Запрос с использованием Proxy и парсинг данных в случае успешного запроса
  const getData = (url) => {
    const proxiedUrl = addProxy(url);
    watchedState.loadingProcess.status = 'loading';
    axios.get(proxiedUrl)
      .then((response) => {
        watchedState.loadingProcess.status = 'succes';
        try {
          const data = parser(response.data.contents);
          watchedState.feeds.push(data.channel);
          watchedState.posts.push(...data.posts);
        } catch (parsingError) {
          watchedState.parser.error = parsingError;
        }
      })
      .catch((networkError) => {
        watchedState.loadingProcess.error = networkError;
        watchedState.loadingProcess.status = 'error';
      });
  };

  const watchedState = onChange(initialState, render(elements, initialState));

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const inputValue = formData.get('url');

    validate(inputValue)
      .then((validationResult) => {
        if (validationResult === true) {
          watchedState.form.isValid = true;
          watchedState.form.error = '';
          getData(inputValue);
        } else {
          watchedState.form.error = validationResult;
          watchedState.form.isValid = false;
        }
      });
  });
};
