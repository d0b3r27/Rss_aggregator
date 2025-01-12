/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const inputRender = (elements, state, processState) => {
  switch (processState) {
    case false:
      elements.input.classList.add('is-invalid');
      elements.feedback.classList.remove('text-success', 'text-info');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = state.form.validationError;
      break;
    case true:
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = '';
      elements.feedback.classList.remove('text-danger', 'text-info');
      elements.feedback.classList.add('text-success');
      break;
    default:
      break;
  }
};

const formRender = (elements, processState, i18next) => {
  switch (processState) {
    case 'sending':
      elements.submitButton.disabled = true;
      break;
    case 'filling':
      elements.submitButton.disabled = false;
      break;
    case 'success':
      elements.submitButton.disabled = false;
      elements.feedback.textContent = i18next.t('rssSuccess');
      elements.feedback.classList.remove('text-danger', 'text-info');
      elements.feedback.classList.add('text-success');
      elements.input.value = '';
      elements.input.focus();
      break;
    default:
      break;
  }
};

const parserErrorRender = (elements, state, processState, i18next) => {
  switch (processState) {
    case 'error':
      elements.feedback.classList.remove('text-success', 'text-info');
      elements.feedback.classList.add('text-danger');
      elements.feedback.textContent = i18next.t(state.parser.error);
      break;
    default:
      break;
  }
};

const loadingProcessRender = (elements, processState, i18next) => {
  switch (processState) {
    case 'loading':
      elements.feedback.textContent = i18next.t('loadingProcess.loading');
      elements.feedback.classList.remove('text-danger', 'text-success');
      elements.feedback.classList.add('text-info');
      break;
    case 'success':
      elements.feedback.textContent = i18next.t('loadingProcess.success');
      elements.feedback.classList.remove('text-danger', 'text-success');
      elements.feedback.classList.add('text-info');
      break;
    case 'error':
      elements.feedback.textContent = i18next.t('errors.networkError');
      elements.feedback.classList.remove('text-success', 'text-info');
      elements.feedback.classList.add('text-danger');
      break;
    default:
      break;
  }
};

const feedsRender = (elements, data, i18next) => {
  const container = document.createElement('div');
  container.className = 'card border-0';
  container.innerHTML = `<div class="card-body"><h2 class="card-title h4">${i18next.t('feeds')}</h2></div>`;
  const ulOfFeeds = document.createElement('ul');
  ulOfFeeds.classList.add('list-group', 'border-0', 'rounses-0');
  data.forEach((feed) => {
    const li = document.createElement('li');
    li.className = 'list-group-item border-0 border-end-0';
    li.innerHTML = `<h3 class="h6 m-0">${feed.title}</h3><p class="m-0 small text-black-50">${feed.description}</p>`;
    ulOfFeeds.prepend(li);
  });
  elements.feeds.innerHTML = '';
  elements.feeds.append(container);
  container.append(ulOfFeeds);
};

const postsRender = (elements, data, i18next) => {
  const container = document.createElement('div');
  container.className = 'card border-0';
  container.innerHTML = `<div class="card-body"><h2 class="card-title h4">${i18next.t('posts')}</h2></div>`;
  const ulOfPosts = document.createElement('ul');
  ulOfPosts.classList.add('list-group', 'border-0', 'rounded-0');
  data.forEach((post) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

    const postElement = document.createElement('a');
    postElement.setAttribute('data-id', post.id);
    postElement.href = post.link;
    postElement.className = 'fw-bold';
    postElement.target = '_blank';
    postElement.rel = 'noopener noreferrer';
    postElement.textContent = post.title;

    const previewButton = document.createElement('button');
    previewButton.setAttribute('data-id', post.id);
    previewButton.type = 'button';
    previewButton.className = 'btn btn-outline-primary btn-sm';
    previewButton.dataset.bsToggle = 'modal';
    previewButton.dataset.bsTarget = '#modal';
    previewButton.textContent = i18next.t('preview');

    li.append(postElement);
    li.append(previewButton);
    ulOfPosts.prepend(li);
  });
  elements.posts.innerHTML = '';
  elements.posts.append(container);
  container.append(ulOfPosts);
};

const readedPostsRender = (readedPostsId) => {
  readedPostsId.forEach((id) => {
    const postTitle = document.querySelector(`a[data-id="${id}"]`);
    postTitle.className = 'fw-normal';
  });
};

const modalRender = (elements, state, previewPostId, i18next) => {
  const currentPost = state.posts.find((post) => post.id === previewPostId);
  elements.modalTitle.textContent = currentPost.title;
  elements.modalBody.textContent = currentPost.description;
  elements.modalReadButton.href = currentPost.link;
  elements.modalReadButton.textContent = i18next.t('modal.read');
  elements.modalCloseButton.textContent = i18next.t('modal.close');
};

const render = (elements, state, i18next) => (path, value) => {
  switch (path) {
    case 'form.isValid':
      inputRender(elements, state, value);
      break;
    case 'form.status':
      formRender(elements, value, i18next);
      break;
    case 'parser.status':
      parserErrorRender(elements, state, value, i18next);
      break;
    case 'loadingProcess.status':
      loadingProcessRender(elements, value, i18next, state);
      break;
    case 'feeds':
      feedsRender(elements, value, i18next);
      break;
    case 'posts':
      postsRender(elements, value, i18next);
      break;
    case 'previewPostId':
      modalRender(elements, state, value, i18next);
      break;
    case 'readedPostsId':
      readedPostsRender(value);
      break;
    default:
      break;
  }
};

export default (elements, state, i18next) => onChange(state, render(elements, state, i18next));
