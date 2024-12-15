export default (response) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(response, 'text/xml');
  return data;
}
