/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const elementTextColor = (element, color) => {
  switch (color) {
    case 'green':
      element.classList.remove('text-danger', 'text-info');
      element.classList.add('text-success');
      break;
    case 'red':
      element.classList.remove('text-success', 'text-info');
      element.classList.add('text-danger');
      break;
    case 'blue':
      element.classList.remove('text-danger', 'text-success');
      element.classList.add('text-info');
      break;
    default:
      break;
  }
};

const inputRender = (elements, state, isValid, i18next) => {
  if (isValid) {
    elements.input.classList.remove('is-invalid');
    elements.feedback.textContent = '';
  } else {
    elements.input.classList.add('is-invalid');
    elementTextColor(elements.feedback, 'red');
    elements.feedback.textContent = i18next.t(`${state.form.error}`);
  }
};

const loadingProcessRender = (elements, state, status, i18next) => {
  switch (status) {
    case 'loading':
      elements.submitButton.disabled = true;
      elements.input.disabled = true;
      elements.feedback.textContent = i18next.t('loadingProcess.loading');
      elementTextColor(elements.feedback, 'blue');
      break;
    case 'dataReceived':
      elements.feedback.textContent = i18next.t('loadingProcess.success');
      break;
    case 'success':
      elements.input.disabled = false;
      elements.submitButton.disabled = false;
      elements.feedback.textContent = i18next.t('rssSuccess');
      elementTextColor(elements.feedback, 'green');
      elements.input.value = '';
      elements.input.focus();
      break;
    case 'error':
      elements.input.disabled = false;
      elements.submitButton.disabled = false;
      if (state.loadingProcess.error === 'errors.noChannelInRss' || state.loadingProcess.error === 'errors.parsingError') {
        elements.feedback.textContent = i18next.t(`${state.loadingProcess.error}`);
      } else {
        elements.feedback.textContent = i18next.t('errors.networkError');
      }
      elementTextColor(elements.feedback, 'red');
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

    const feedTitle = document.createElement('h3');
    feedTitle.className = 'h6 m-0';
    feedTitle.textContent = feed.title;

    const feedDescription = document.createElement('p');
    feedDescription.classList = 'm-0 small text-black-50';
    feedDescription.textContent = feed.description;

    li.append(feedTitle, feedDescription);
    ulOfFeeds.prepend(li);
  });
  elements.feeds.innerHTML = '';
  elements.feeds.append(container);
  container.append(ulOfFeeds);
};

const postsRender = (elements, state, i18next) => {
  const container = document.createElement('div');
  container.className = 'card border-0';
  container.innerHTML = `<div class="card-body"><h2 class="card-title h4">${i18next.t('posts')}</h2></div>`;
  const ulOfPosts = document.createElement('ul');
  ulOfPosts.classList.add('list-group', 'border-0', 'rounded-0');
  state.posts.forEach((post) => {
    const li = document.createElement('li');
    li.className = 'list-group-item d-flex justify-content-between align-items-start border-0 border-end-0';

    const postElement = document.createElement('a');
    postElement.setAttribute('data-id', post.id);
    postElement.href = post.link;

    if (state.ui.readedPostsId.has(post.id)) {
      postElement.className = 'fw-normal';
    } else {
      postElement.className = 'fw-bold';
    }

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
      inputRender(elements, state, value, i18next);
      break;
    case 'loadingProcess.status':
      loadingProcessRender(elements, state, value, i18next);
      break;
    case 'feeds':
      feedsRender(elements, value, i18next);
      break;
    case 'posts':
    case 'ui.readedPostsId':
      postsRender(elements, state, i18next);
      break;
    case 'ui.previewPostId':
      modalRender(elements, state, value, i18next);
      break;
    default:
      break;
  }
};

export default (elements, state, i18next) => onChange(state, render(elements, state, i18next));
