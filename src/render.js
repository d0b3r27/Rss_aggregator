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
  };
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
  };
}

export default (elements, state) => (path, value) => {
  switch (path) {
    case 'form.isValid': 
      inputRender(elements, state, value);
      break;
    case 'form.status':
      formRender(elements, value);
      break;
  };
};