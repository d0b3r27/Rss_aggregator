import uniqueId from 'lodash.uniqueid';

export default (response) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(response, 'text/xml');
  const errorNode = data.querySelector('parsererror');
  if (errorNode) {
    throw new Error('Parsing error');
  }
  const channel = data.querySelector('channel');
  if (!channel) {
    throw new Error('No channel found in RSS feed');
  }
  const channelTitle = channel.querySelector('title')?.textContent || '';
  const channelDescription = channel.querySelector('description')?.textContent || '';
  const channelLink = channel.querySelector('link')?.textContent || '';
  const items = Array.from(channel.querySelectorAll('item')).map((item) => ({
    id: uniqueId(),
    title: item.querySelector('title')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
  }));

  return {
    channel: {
      title: channelTitle,
      description: channelDescription,
      link: channelLink,
    },
    posts: items,
  };
};
