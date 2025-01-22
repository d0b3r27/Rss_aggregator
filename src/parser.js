export default (content) => {
  const parser = new DOMParser();
  const data = parser.parseFromString(content, 'text/xml');
  const channel = data.querySelector('channel');
  if (!channel) {
    throw (new Error('errors.noChannelInRss'));
  }
  const errorNode = data.querySelector('parsererror');
  if (errorNode) {
    throw (new Error(('errors.parsingError')));
  }
  const channelTitle = channel.querySelector('title')?.textContent || '';
  const channelDescription = channel.querySelector('description')?.textContent || '';
  const channelLink = channel.querySelector('link')?.textContent || '';
  const items = Array.from(channel.querySelectorAll('item')).map((item) => ({
    title: item.querySelector('title')?.textContent || '',
    description: item.querySelector('description')?.textContent || '',
    pubDate: item.querySelector('pubDate')?.textContent || '',
    link: item.querySelector('link')?.textContent || '',
  }));
  const sortedItems = items.sort((a, b) => new Date(a.pubDate) - new Date(b.pubDate));
  return {
    channel: {
      title: channelTitle,
      description: channelDescription,
      link: channelLink,
    },
    posts: sortedItems,
  };
};
