const inputRender = (elements, state, processState) => {
  switch (processState) {
    case false:
      elements.input.classList.add('is-invalid');
      elements.feedback.textContent = state.form.error;
      elements.feedback.classList.add('text-danger');
      break;
    case true:
      elements.input.classList.remove('is-invalid');
      elements.feedback.textContent = '';
      break;
    default:
      elements.feedback.textContent = 'Неизвестное состояние валидации';
  }
};

const formRender = (elements, processState) => {
  switch (processState) {
    case 'sending':
      elements.submitButton.disabled = true;
      break;
    case 'filling':
      elements.submitButton.disabled = false;
      break;
    case 'success':
      elements.submitButton.disabled = false;
      elements.feedback.textContent = 'RSS успешно загружен';
      elements.feedback.classList.add('text-success');
      elements.feedback.classList.remove('text-danger');
      elements.input.value = '';
      elements.input.focus();
      break;
    default:
      elements.feedback.textContent = 'Неизвестное состояние статуса отправки';
  }
};

const feedsRender = (elements, data) => {
  const container = document.createElement('div');
  container.className = 'card border-0';
  container.innerHTML = '<div class="card-body"><h2 class="card-title h4">Фиды</h2></div>';
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

const postsRender = (elements, data) => {
  const container = document.createElement('div');
  container.className = 'card border-0';
  container.innerHTML = '<div class="card-body"><h2 class="card-title h4">Посты</h2></div>';
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
    previewButton.textContent = 'Просмотр';

    li.append(postElement);
    li.append(previewButton);
    ulOfPosts.prepend(li);
  });
  elements.posts.innerHTML = '';
  elements.posts.append(container);
  container.append(ulOfPosts);
};

const modalRender = (elements, state, currentId) => {
  const currentPost = state.posts.find((post) => post.id === currentId);
  elements.modalTitle.textContent = currentPost.title;
  elements.modalBody.textContent = currentPost.description;
  elements.modalReadButton.href = currentPost.link;
};

export default (elements, state) => (path, value) => {
  switch (path) {
    case 'form.isValid':
      inputRender(elements, state, value);
      break;
    case 'form.status':
      formRender(elements, value);
      break;
    case 'parser.error':
      elements.feedback.textContent = state.parser.error.message;
      break;
    case 'loadingProcess.error':
      console.log(state.loadingProcess.error);
      break;
    case 'parser.data':
      console.log(state.parser.data);
      break;
    case 'feeds':
      feedsRender(elements, value);
      break;
    case 'posts':
      postsRender(elements, value);
      break;
    case 'currentId':
      modalRender(elements, state, value);
      break;
    // default:
    //   elements.feedback.textContent = 'неизвестное состояние State';
  }
};
