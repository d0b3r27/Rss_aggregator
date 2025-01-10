import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import res from './locales/index.js';
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
      status: '',
      error: '',
    },
    posts: [],
    readedPostsId: [],
    previewPostId: '',
    feeds: [],
    addedUrls: [],
    lng: 'ru',
    autoUpdate: {
      time: 5000,
      error: '',
    },
  };

  const addProxyToUrl = (url) => `https://allorigins.hexlet.app/get?disableCache=true&url=${encodeURIComponent(url)}`;

  const getData = (url, state) => {
    const proxiedUrl = addProxyToUrl(url);
    return axios.get(proxiedUrl)
      .then((response) => response.data.contents)
      .catch((error) => {
        state.loadingProcess.status = 'error';
        throw error.message;
      });
  };

  const rssUpdate = (state, i18n) => {
    state.addedUrls.forEach((url) => {
      getData(url, state)
        .then((response) => parser(response, state, i18n))
        .then(({ posts }) => {
          const addedPostsId = state.posts.map((post) => post.link);
          const newPosts = posts.filter((item) => !addedPostsId.includes(item.link));
          state.posts.push(...newPosts);
        })
        .catch((error) => {
          state.autoUpdate.error = error.message;
          throw error;
        });
    });
    setTimeout(() => rssUpdate(state, i18n), state.autoUpdate.time);
  };

  const i18nextInstatce = i18next.createInstance();
  i18nextInstatce.init({
    lng: initialState.lng,
    resources: res,
  })
    .then(() => {
      const watchedState = watcher(elements, initialState, i18nextInstatce);

      const schema = yup
        .string()
        .url(i18nextInstatce.t('errors.invalidUrl'))
        .required(i18nextInstatce.t('errors.empty'))
        .test(
          'unique-url',
          i18nextInstatce.t('errors.alreadyExists'),
          (value) => !watchedState.addedUrls.includes(value),
        );

      const isValid = (url, state) => schema.validate(url)
        .then(() => {
          state.form.isValid = true;
        })
        .catch((error) => {
          state.form.validationError = error.message;
          state.form.isValid = false;
          state.form.isValid = null;
          throw error.message;
        });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputValue = formData.get('url');
        watchedState.form.validationError = '';

        isValid(inputValue, watchedState)
          .then(() => {
            watchedState.form.validationError = '';
            watchedState.parser.error = '';
            watchedState.loadingProcess.error = '';
            watchedState.form.status = 'sending';
            watchedState.loadingProcess.status = 'loading';
            return getData(inputValue, watchedState);
          })
          .then((response) => {
            watchedState.loadingProcess.status = 'success';
            return parser(response, watchedState, i18nextInstatce);
          })
          .then((data) => {
            watchedState.parser.status = '';
            watchedState.loadingProcess.status = 'idle';
            watchedState.feeds.push(data.channel);
            watchedState.posts.push(...data.posts);
            watchedState.addedUrls.push(inputValue);
            watchedState.form.status = 'success';
          })
          .then(() => setTimeout(() => rssUpdate(watchedState, i18nextInstatce), 5000))
          .catch((error) => {
            watchedState.form.status = 'filling';
            if (watchedState.loadingProcess.status === 'error') {
              watchedState.loadingProcess.error = error.message;
            } if (watchedState.parser.status === 'error') {
              watchedState.parser.error = error.message;
            }
          });
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          watchedState.previewPostId = e.target.dataset.id;
          if (!watchedState.readedPostsId.includes(e.target.dataset.id)) {
            watchedState.readedPostsId.push(e.target.dataset.id);
          }
        } if (e.target.tagName === 'A' && !watchedState.readedPostsId.includes(e.target.dataset.id)) {
          watchedState.readedPostsId.push(e.target.dataset.id);
        }
      });
    });
};
