/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import resources from './locales/index.js';
import watch from './view.js';
import parser from './parser.js';

const addProxy = (url) => {
  const allOriginsLink = 'https://allorigins.hexlet.app/get';
  const proxyLink = new URL(allOriginsLink);
  proxyLink.searchParams.set('disableCache', 'true');
  proxyLink.searchParams.set('url', url);
  return proxyLink;
};

const getRssData = (url, state) => {
  const proxiedUrl = addProxy(url);
  state.form.status = 'sending';
  state.loadingProcess.status = 'loading';
  axios.get(proxiedUrl)
    .then((response) => {
      state.loadingProcess.status = 'success';
      return parser(response.data.contents);
    })
    .then((data) => {
      state.feeds.push(data.channel);
      state.posts.data.push(...data.posts);
      state.posts.addedUrls.push(url);
      state.form.status = 'success';
    })
    .catch((error) => {
      state.loadingProcess.error = error.message;
      state.loadingProcess.status = 'error';
    })
    .finally(() => {
      state.form.status = 'filling';
      state.form.validationError = '';
      state.loadingProcess.status = 'idle';
      state.loadingProcess.error = '';
    });
};

const update = (state, updateTime) => {
  const updateFeeds = state.posts.addedUrls.map((url) => {
    const proxiedUrl = addProxy(url);
    return axios.get(proxiedUrl)
      .then((response) => parser(response.data.contents))
      .then(({ posts }) => {
        const existingLinks = state.posts.data.map((post) => post.link);
        const newPosts = posts.filter((post) => !existingLinks.includes(post.link));
        state.posts.data.push(...newPosts);
      })
      .catch((error) => {
        throw new Error(`Ошибка при обновлении фида: ${url}`, error);
      });
  });

  Promise.all(updateFeeds)
    .catch((error) => error.message)
    .finally(() => {
      setTimeout(() => update(state, updateTime), updateTime);
    });
};

export default () => {
  const defaultLanguage = 'ru';
  const updateTime = 5000;

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
    posts: {
      data: [],
      addedUrls: [],
    },
    ui: {
      readedPostsId: [],
      previewPostId: '',
    },
    feeds: [],
  };

  const i18nextInstatce = i18next.createInstance();
  i18nextInstatce.init({
    lng: defaultLanguage,
    resources,
  })
    .then(() => {
      const watchedState = watch(elements, initialState, i18nextInstatce);

      const validate = (url, urls) => {
        const schema = yup
          .string()
          .url('errors.invalidUrl')
          .required('errors.empty')
          .notOneOf(urls, 'errors.alreadyExists');

        return schema.validate(url)
          .then(() => null)
          .catch((error) => error.message);
      };

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputValue = formData.get('url');
        const urls = watchedState.posts.addedUrls;
        watchedState.form.isValid = true;

        validate(inputValue, urls)
          .then((error) => {
            if (error) {
              watchedState.form.validationError = error;
              watchedState.form.isValid = false;
              return;
            }
            watchedState.form.isValid = true;
            getRssData(inputValue, watchedState);
          });
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.dataset.id && !watchedState.ui.readedPostsId.includes(e.target.dataset.id)) {
          watchedState.ui.previewPostId = e.target.dataset.id;
          watchedState.ui.readedPostsId.push(e.target.dataset.id);
        }
      });

      update(watchedState, updateTime);
    });
};
