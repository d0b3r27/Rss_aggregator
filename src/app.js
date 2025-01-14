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

const update = (state) => {
  state.posts.addedUrls.forEach((url) => {
    const proxiedUrl = addProxy(url);
    axios.get(proxiedUrl, state)
      .then((response) => parser(response.data.contents))
      .then(({ posts }) => {
        const addedPostsId = state.posts.data.map((post) => post.link);
        const newPosts = posts.filter((item) => !addedPostsId.includes(item.link));
        state.posts.data.push(...newPosts);
      })
      .catch((error) => {
        state.autoUpdate.error = error.message;
      });
  });
  setTimeout(() => update(state), state.autoUpdate.time);
};

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
    posts: {
      data: [],
      addedUrls: [],
    },
    ui: {
      readedPostsId: [],
      previewPostId: '',
    },
    feeds: [],
    lng: 'ru',
    autoUpdate: {
      time: 5000,
      error: '',
    },
  };

  const i18nextInstatce = i18next.createInstance();
  i18nextInstatce.init({
    lng: initialState.lng,
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

        validate(inputValue, urls)
          .then((error) => {
            if (error) {
              watchedState.form.validationError = error;
              watchedState.form.isValid = false;
              watchedState.form.isValid = null;
              return;
            }
            watchedState.form.isValid = true;
            getRssData(inputValue, watchedState);
          })
          .then(() => setTimeout(() => update(watchedState), 5000));
      });

      elements.posts.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
          watchedState.ui.previewPostId = e.target.dataset.id;
          if (!watchedState.ui.readedPostsId.includes(e.target.dataset.id)) {
            watchedState.ui.readedPostsId.push(e.target.dataset.id);
          }
        } if (e.target.tagName === 'A' && !watchedState.ui.readedPostsId.includes(e.target.dataset.id)) {
          watchedState.ui.readedPostsId.push(e.target.dataset.id);
        }
      });
    });
};
