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

  const getRssData = (url, state) => {
    const proxiedUrl = addProxyToUrl(url);
    state.form.status = 'sending';
    state.loadingProcess.status = 'loading';
    axios.get(proxiedUrl)
      .then((response) => {
        state.loadingProcess.status = 'success';
        return parser(response.data.contents);
      })
      .then((data) => {
        state.feeds.push(data.channel);
        state.posts.push(...data.posts);
        state.addedUrls.push(url);
        state.form.status = 'success';
      })
      .catch((error) => {
        if (error.message === 'errors.noChannelInRss' || error.message === 'errors.parsingError') {
          state.parser.error = error.message;
          state.parser.status = 'error';
        } else {
          state.loadingProcess.status = 'error';
        }
      })
      .finally(() => {
        state.form.status = 'filling';
        state.form.validationError = '';
        state.loadingProcess.status = 'idle';
        state.loadingProcess.error = '';
        state.parser.status = '';
        state.parser.error = '';
      });
  };

  const rssUpdate = (state) => {
    state.addedUrls.forEach((url) => {
      const proxiedUrl = addProxyToUrl(url);
      axios.get(proxiedUrl, state)
        .then((response) => parser(response))
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
    setTimeout(() => rssUpdate(state), state.autoUpdate.time);
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
          throw error;
        });

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputValue = formData.get('url');

        isValid(inputValue, watchedState)
          .then(() => getRssData(inputValue, watchedState, i18nextInstatce))
          .then(() => setTimeout(() => rssUpdate(watchedState), 5000))
          .catch((error) => {
            watchedState.form.validationError = error.message;
            watchedState.form.isValid = false;
            watchedState.form.isValid = null;
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
