import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales/index.js';
import watcher from './view.js';
import parser from './parser.js';

export default () => {
  const elements = {
    input: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    submitButton: document.querySelector('form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    previewButtons: document.querySelectorAll('.posts button'),
    feeds: document.querySelector('.feeds'),
    modalTitle: document.querySelector('.modal-title'),
    modalBody: document.querySelector('.modal-body'),
    modalReadButton: document.querySelector('.full-article'),
    modalCloseButton: document.querySelector('button.btn-secondary[data-bs-dismiss="modal"]'),
  };

  const initialState = {
    form: {
      status: 'filling',
      isValid: 'false',
      validationError: '',
    },
    loadingProcess: {
      status: 'idle',
      error: '',
    },
    parser: {
      error: '',
    },
    posts: [],
    currentId: '',
    feeds: [],
    addedUrls: [],
    lng: 'ru',
  };

  // Добавление Proxy к URL
  const addProxy = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  // Запрос с использованием Proxy
  const getData = (url, state) => {
    const proxiedUrl = addProxy(url);
    state.loadingProcess.status = 'loading';
    return axios.get(proxiedUrl)
      .then((response) => {
        state.loadingProcess.status = 'succes';
        return response.data.contents;
      })
      .then((data) => {
        state.loadingProcess.status = 'idle';
        return data;
      })
      .catch((error) => {
        state.loadingProcess.error = error.message;
        state.loadingProcess.status = 'error';
        throw error.message;
      });
  };

  const i18nextInstatce = i18next.createInstance();
  i18nextInstatce.init({
    lng: initialState.lng,
    resources: resources,
  })
    .then(() => {
      const watchedState = watcher(elements, initialState, i18nextInstatce);

      // Схема валидации
      const schema = yup
        .string()
        .url(i18nextInstatce.t('errors.invalidUrl'))
        .required(i18nextInstatce.t('errors.empty'))
        .test(
          'unique-url',
          i18nextInstatce.t('errors.alreadyExists'),
          (value) => !watchedState.addedUrls.includes(value),
        );

      // Валидатор
      const validate = (url, state) => schema.validate(url)
        .then(() => {
          state.form.isValid = true;
          state.form.validationError = '';
        })
        .catch((error) => {
          state.form.validationError = error.message;
          state.form.isValid = false;
          throw error.message;
        });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputValue = formData.get('url');
        watchedState.form.validationError = '';

        validate(inputValue, watchedState)
          .then(() => {
            watchedState.form.status = 'sending';
            return getData(inputValue, watchedState);
          })
          .then((response) => parser(response, watchedState, i18nextInstatce))
          .then((data) => {
            watchedState.feeds.push(data.channel);
            watchedState.posts.push(...data.posts);
            watchedState.addedUrls.push(inputValue);
            watchedState.form.status = 'success';
          })
          .catch((error) => {
            watchedState.form.status = 'filling';
            // watchedState.parser.error = error.message;
          });
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          watchedState.currentId = e.target.dataset.id;
        }
      });
    });
};
