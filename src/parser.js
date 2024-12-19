
export default (response) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(response, 'text/xml');
  const errorNode = data.querySelector("parsererror");
  if (errorNode) {
    throw new Error('Parsing error');
  } else {
    return data;
  }
};

