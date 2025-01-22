/* eslint-disable no-param-reassign */
import * as yup from 'yup';
import axios from 'axios';
import i18next from 'i18next';
import uniqueId from 'lodash/uniqueId.js';
import resources from './locales/index.js';
import watch from './view.js';
import parser from './parser.js';

const defaultLanguage = 'ru';
const updateTime = 5000;

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

const addProxy = (url) => {
  const allOriginsLink = 'https://allorigins.hexlet.app/get';
  const proxyLink = new URL(allOriginsLink);
  proxyLink.searchParams.set('disableCache', 'true');
  proxyLink.searchParams.set('url', url);
  return proxyLink;
};

const enrichmentOfPosts = (posts, feedId) => {
  const enrichedPosts = posts.map((post) => ({
    ...post,
    feedId,
    id: uniqueId(),
  }));
  return enrichedPosts;
};

const getRssData = (url, state) => {
  const proxiedUrl = addProxy(url);
  state.loadingProcess.status = 'loading';
  axios.get(proxiedUrl)
    .then((response) => {
      state.loadingProcess.status = 'dataReceived';
      return parser(response.data.contents);
    })
    .then((data) => {
      const { channel, posts } = data;
      const feedId = uniqueId();

      const enrichedChannel = {
        ...channel,
        id: feedId,
        url,
      };

      const enrichedPosts = enrichmentOfPosts(posts, feedId);
      state.feeds.push(enrichedChannel);
      state.posts.push(...enrichedPosts);
      state.loadingProcess.status = 'success';
    })
    .catch((error) => {
      state.loadingProcess.error = error.message;
      state.loadingProcess.status = 'error';
    })
    .finally(() => {
      state.form.validationError = '';
      state.loadingProcess.status = 'idle';
      state.loadingProcess.error = '';
    });
};

const update = (state, timeout) => {
  const updateFeeds = state.feeds.map((feed) => {
    const proxiedUrl = addProxy(feed.url);
    const linksOfPostsInFeed = state.posts
      .filter(({ feedId }) => feedId === feed.id)
      .map((post) => post.link);

    return axios.get(proxiedUrl)
      .then((response) => {
        const { posts } = parser(response.data.contents);
        const newPosts = posts.filter((post) => !linksOfPostsInFeed.includes(post.link));
        const enrichedNewPosts = enrichmentOfPosts(newPosts, feed.id);
        state.posts.push(...enrichedNewPosts);
      })
      .catch((error) => {
        console.log(`Ошибка при обновлении фида: ${feed.url}`, error);
      });
  });

  Promise.all(updateFeeds)
    .finally(() => {
      setTimeout(() => update(state, timeout), timeout);
    });
};

export default () => {
  const elements = {
    input: document.querySelector('#url-input'),
    form: document.querySelector('.rss-form'),
    submitButton: document.querySelector('.rss-form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    modalTitle: document.querySelector('#modal .modal-title'),
    modalBody: document.querySelector('#modal .modal-body'),
    modalReadButton: document.querySelector('#modal .btn-primary'),
    modalCloseButton: document.querySelector('#modal .btn-secondary'),
  };

  const initialState = {
    form: {
      isValid: 'false',
      validationError: '',
    },
    loadingProcess: {
      status: 'idle',
      error: '',
    },
    posts: [],
    feeds: [],
    ui: {
      readedPostsId: new Set(),
      previewPostId: '',
    },
  };

  const i18nextInstatce = i18next.createInstance();
  i18nextInstatce.init({
    lng: defaultLanguage,
    resources,
  })
    .then(() => {
      const watchedState = watch(elements, initialState, i18nextInstatce);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const inputValue = formData.get('url');
        const urls = watchedState.feeds.map(({ url }) => url);
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
        if (e.target.dataset.id) {
          watchedState.ui.previewPostId = e.target.dataset.id;
          watchedState.ui.readedPostsId.add(e.target.dataset.id);
        }
      });

      update(watchedState, updateTime);
    });
};
